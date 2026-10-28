import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";
config({ path: ".env.local" });

import { db, pool } from "../src/server/db";
import { nextSequence } from "../src/server/sequence";
import { formatMembershipId, formatReceiptNumber, getIndiaCalendarYear } from "../src/server/formatters";
import { rupeesToPaise, paiseToRupees, addRupees, subtractRupees, compareRupees, formatRupeesDisplay } from "../src/server/money";
import { writeAudit } from "../src/server/audit";
import { auditLogs, counters } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Data-access foundation tests", () => {
  it("formats membership ID correctly", () => {
    assert.equal(formatMembershipId(1), "CHSOBA-0001");
    assert.equal(formatMembershipId(42), "CHSOBA-0042");
    assert.equal(formatMembershipId(9999), "CHSOBA-9999");
    assert.equal(formatMembershipId(10000), "CHSOBA-10000");
    assert.throws(() => formatMembershipId(0));
    assert.throws(() => formatMembershipId(-5));
  });

  it("formats receipt numbers correctly according to FRS §8.1", () => {
    assert.equal(formatReceiptNumber("membership", 2026, 1), "LM/2026/0001");
    assert.equal(formatReceiptNumber("endowment", 2026, 15), "END/2026/0015");
    assert.throws(() => formatReceiptNumber("membership", 2026, 0));
  });

  it("calculates Asia/Kolkata calendar year properly", () => {
    const year = getIndiaCalendarYear();
    assert.ok(typeof year === "number" && year >= 2024);
  });

  it("money helpers perform exact decimal & paise arithmetic without floats", () => {
    assert.equal(rupeesToPaise("1000.00"), BigInt(100000));
    assert.equal(rupeesToPaise("1000"), BigInt(100000));
    assert.equal(rupeesToPaise("0.50"), BigInt(50));
    assert.equal(rupeesToPaise("0.05"), BigInt(5));

    assert.equal(paiseToRupees(BigInt(100000)), "1000.00");
    assert.equal(paiseToRupees(BigInt(50)), "0.50");
    assert.equal(paiseToRupees(BigInt(5)), "0.05");

    // Exact addition: 0.10 + 0.20 = 0.30 (float would produce 0.30000000000000004)
    assert.equal(addRupees("0.10", "0.20"), "0.30");
    assert.equal(subtractRupees("1000.00", "250.75"), "749.25");
    assert.equal(compareRupees("1000.00", "1000.00"), 0);
    assert.equal(compareRupees("1000.00", "500.00"), 1);
    assert.equal(compareRupees("500.00", "1000.00"), -1);
    assert.equal(formatRupeesDisplay("100000.50"), "₹1,00,000.50");
  });

  it("writes audit logs within the same transaction", async () => {
    await db.transaction(async (tx) => {
      await writeAudit(tx, {
        action: "test.foundation_init",
        entityType: "system",
        entityId: "init",
        newValue: { test: true },
        reason: "Verifying audit table within transaction",
      });
    });

    const entries = await db.select().from(auditLogs).where(eq(auditLogs.action, "test.foundation_init"));
    assert.ok(entries.length > 0);
    assert.equal(entries[0].entityType, "system");
  });

  it("prevents UPDATE and DELETE on audit_logs via PostgreSQL trigger (append-only guard)", async () => {
    const entries = await db.select().from(auditLogs).where(eq(auditLogs.action, "test.foundation_init"));
    assert.ok(entries.length > 0);
    const targetId = entries[0].id;

    // Attempt UPDATE: should be rejected by prevent_audit_logs_tampering trigger
    await assert.rejects(
      async () => {
        await db.update(auditLogs).set({ reason: "Tampered" }).where(eq(auditLogs.id, targetId));
      },
      (err: any) => {
        const message = err?.message || "";
        const causeMessage = err?.cause?.message || "";
        return (
          message.includes("audit_logs is an append-only table") ||
          causeMessage.includes("audit_logs is an append-only table")
        );
      }
    );

    // Attempt DELETE: should be rejected by prevent_audit_logs_tampering trigger
    await assert.rejects(
      async () => {
        await db.delete(auditLogs).where(eq(auditLogs.id, targetId));
      },
      (err: any) => {
        const message = err?.message || "";
        const causeMessage = err?.cause?.message || "";
        return (
          message.includes("audit_logs is an append-only table") ||
          causeMessage.includes("audit_logs is an append-only table")
        );
      }
    );
  });

  it("runs 50 concurrent nextSequence calls with ZERO duplicates and ZERO gaps", async () => {
    const testKey = `test:concurrent_sequence:${Date.now()}`;
    const concurrency = 50;

    // Fire 50 concurrent transactions invoking nextSequence
    const promises = Array.from({ length: concurrency }, () =>
      db.transaction(async (tx) => {
        return await nextSequence(tx, testKey);
      })
    );

    const results = await Promise.all(promises);

    // Sort to verify sequential consistency
    results.sort((a, b) => a - b);

    // Check count
    assert.equal(results.length, concurrency);

    // Check no duplicates: set size must be exactly 50
    const uniqueSet = new Set(results);
    assert.equal(uniqueSet.size, concurrency, `Expected 50 unique numbers, found ${uniqueSet.size}`);

    // Check no gaps: sequence must run from 1 to 50 consecutively
    for (let i = 0; i < concurrency; i++) {
      assert.equal(results[i], i + 1, `Gap or order violation at index ${i}: expected ${i + 1}, got ${results[i]}`);
    }

    // Verify counter table final value
    const [counterRow] = await db.select().from(counters).where(eq(counters.key, testKey));
    assert.equal(counterRow.value, concurrency);
  });
});

// Close pool after tests finish
process.on("exit", () => {
  pool.end();
});

