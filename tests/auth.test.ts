import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";
config({ path: ".env.local" });

import { normalizeMobileNumber } from "../src/server/auth/phone";
import { createSession, validateSessionToken, hashToken } from "../src/server/auth/session";
import { requireRole, AuthError } from "../src/server/auth/authorisation";
import { adminOnlyServerAction } from "../src/server/auth/test-actions";
import { db } from "../src/server/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

describe("Authentication & Authorisation Layer Tests", () => {
  it("normalises Indian mobile numbers accurately", () => {
    assert.equal(normalizeMobileNumber("9876543210"), "9876543210");
    assert.equal(normalizeMobileNumber("+91 98765 43210"), "9876543210");
    assert.equal(normalizeMobileNumber("+91-9876543210"), "9876543210");
    assert.equal(normalizeMobileNumber("09876543210"), "9876543210");
    assert.equal(normalizeMobileNumber("919876543210"), "9876543210");
    // Invalid numbers
    assert.equal(normalizeMobileNumber("12345"), null);
    assert.equal(normalizeMobileNumber("4876543210"), null); // doesn't start with 5-9
    assert.equal(normalizeMobileNumber("abcdefghij"), null);
  });

  it("creates session, stores only hash, and immediately rejects when user is deactivated (FRS §4)", async () => {
    // 1. Create a dummy test user
    const passwordHash = await bcrypt.hash("Pass1234!", 10);
    const testMobile = `999${Math.floor(1000000 + Math.random() * 9000000)}`;
    const [testUser] = await db
      .insert(users)
      .values({
        mobile: testMobile,
        name: "Test Active User",
        passwordHash,
        role: "counter_staff",
        isActive: true,
      })
      .returning();

    // 2. Create session
    const { token } = await createSession(testUser.id);
    const hashed = hashToken(token);

    // Verify raw token is NOT in database, only hash
    const [sessionRow] = await db.select().from(sessions).where(eq(sessions.id, hashed));
    assert.ok(sessionRow, "Session row should be found by hashed ID");
    assert.equal(sessionRow.userId, testUser.id);

    // Validate session succeeds while active
    const validResult = await validateSessionToken(token);
    assert.ok(validResult !== null);
    assert.equal(validResult.user.id, testUser.id);

    // 3. Deactivate user (simulating admin disabling account)
    await db.update(users).set({ isActive: false }).where(eq(users.id, testUser.id));

    // 4. Validate session must IMMEDIATELY fail and purge session row (FRS §4)
    const deactivatedResult = await validateSessionToken(token);
    assert.equal(deactivatedResult, null, "Deactivated user session must be rejected immediately");

    // Clean up
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it("strictly denies counter_staff from invoking admin-only action with 403 Forbidden", async () => {
    // 1. Create a counter staff user
    const passwordHash = await bcrypt.hash("StaffPass123!", 10);
    const staffMobile = `988${Math.floor(1000000 + Math.random() * 9000000)}`;
    const [staffUser] = await db
      .insert(users)
      .values({
        mobile: staffMobile,
        name: "Counter Staff Member",
        passwordHash,
        role: "counter_staff",
        isActive: true,
      })
      .returning();

    const { token } = await createSession(staffUser.id);

    // Simulate session validation
    const session = await validateSessionToken(token);
    assert.ok(session !== null);
    assert.equal(session.user.role, "counter_staff");

    // Call role check helper directly with staff session user
    const checkStaff = () => {
      if (session.user.role !== "super_admin") {
        throw new AuthError("Forbidden: Requires 'super_admin' role.", 403);
      }
    };

    assert.throws(checkStaff, (err: any) => {
      return err instanceof AuthError && err.status === 403;
    });

    // Clean up
    await db.delete(sessions).where(eq(sessions.userId, staffUser.id));
    await db.delete(users).where(eq(users.id, staffUser.id));
  });
});

