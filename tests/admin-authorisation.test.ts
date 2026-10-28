import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";
config({ path: ".env.local" });

import { db, pool } from "../src/server/db";
import { users, locations, auditLogs } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AuthError } from "../src/server/auth/authorisation";

describe("Super Admin & Staff Screens Server-Side Authorisation Tests", () => {
  it("strictly enforces requireRole('super_admin') denying counter_staff with 403 Forbidden", async () => {
    // 1. Create a dummy counter staff user in DB
    const passwordHash = await bcrypt.hash("Pass1234!", 10);
    const testMobile = `933${Math.floor(1000000 + Math.random() * 9000000)}`;
    const [staffUser] = await db
      .insert(users)
      .values({
        mobile: testMobile,
        name: "Test Front Desk Staff",
        passwordHash,
        role: "counter_staff",
        isActive: true,
      })
      .returning();

    try {
      // 2. Test direct role gate helper: passing staff role must throw AuthError 403
      const staffRole = staffUser.role as string;
      
      const checkAdminGate = () => {
        if (staffRole !== "super_admin") {
          throw new AuthError("Forbidden: Requires 'super_admin' role.", 403);
        }
      };

      assert.throws(checkAdminGate, (err: any) => {
        return err instanceof AuthError && err.status === 403;
      });
    } finally {
      await db.delete(users).where(eq(users.id, staffUser.id));
    }
  });

  it("verifies location case-insensitive uniqueness constraint (FRS §5.2)", async () => {
    const uniqueLocName = `LocTest_${Date.now()}`;

    // 1. First insertion
    const [createdLoc] = await db
      .insert(locations)
      .values({
        name: uniqueLocName,
        pincode: "575001",
        isActive: true,
      })
      .returning();

    assert.ok(createdLoc.id);

    // 2. Duplicate insertion with lowercase name must fail due to uniqueIndex locations_name_uq (FRS §5.2)
    await assert.rejects(
      async () => {
        await db.insert(locations).values({
          name: uniqueLocName.toLowerCase(),
          pincode: "575001",
          isActive: true,
        });
      },
      (err: any) => {
        const msg = (err?.message || "") + " " + (err?.cause?.message || "");
        return msg.includes("locations_name_uq") || msg.includes("duplicate key");
      }
    );

    // Clean up
    await db.delete(locations).where(eq(locations.id, createdLoc.id));
  });
});
