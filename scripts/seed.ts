import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "../src/server/db";
import { users, settings, locations, auditLogs } from "../src/db/schema";

/**
 * Database Seed Script for CHSOBA Management System
 * 
 * FRS References:
 * - FRS §4 & §19: Controlled initial setup of Super Admin account.
 * - FRS §5.1: Association header details.
 * - FRS §5.2: Initial location list.
 * - FRS §5.5: Initial membership fee ₹1,000.
 * - FRS §13: Audit log entry for system actions.
 */

interface LocationSeedItem {
  name: string;
  pincode?: string;
}

async function seed() {
  console.log("🌱 Starting CHSOBA database seed...\n");

  // 1. Verify required environment variables
  const adminMobile = process.env.SEED_ADMIN_MOBILE?.trim();
  const adminName = process.env.SEED_ADMIN_NAME?.trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminMobile || !adminName || !adminPassword) {
    console.error(
      "❌ Error: Missing required environment variables.\n" +
      "Please set SEED_ADMIN_MOBILE, SEED_ADMIN_NAME, and SEED_ADMIN_PASSWORD in .env.local"
    );
    process.exit(1);
  }

  // 2. Check idempotency: check if any super_admin already exists
  const existingSuperAdmins = await db
    .select()
    .from(users)
    .where(eq(users.role, "super_admin"))
    .limit(1);

  if (existingSuperAdmins.length > 0) {
    console.log(
      `ℹ️  A Super Admin account already exists (ID: ${existingSuperAdmins[0].id}, Mobile: ${existingSuperAdmins[0].mobile}).\n` +
      "Database seed skipped to prevent accidental overwrites or duplicate Super Admin creation."
    );
    process.exit(0);
  }

  // 3. Hash Super Admin password (12 salt rounds)
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // 4. Read locations seed file
  const locationsFilePath = join(__dirname, "locations.seed.json");
  let locationsToSeed: LocationSeedItem[] = [];

  if (existsSync(locationsFilePath)) {
    try {
      const fileData = readFileSync(locationsFilePath, "utf-8");
      locationsToSeed = JSON.parse(fileData);
    } catch (err) {
      console.warn("⚠️ Warning: Failed to parse locations.seed.json. Continuing without initial locations.");
    }
  }

  // 5. Execute seeding inside a single atomic transaction
  await db.transaction(async (tx) => {
    // 5a. Insert/Upsert Settings (id = 1)
    console.log("-> Seeding Association Settings (id: 1, fee: 1000.00)...");
    await tx
      .insert(settings)
      .values({
        id: 1,
        associationName: "CANARA HIGH SCHOOL OLD BOYS' ASSOCIATION (R.)",
        addressLine: "A.S.R.P. Road, Dongerkery, Mangaluru – 575 003",
        phone: "8296421577",
        email: "canaraoldboys@gmail.com",
        membershipFee: "1000.00",
        authorisedPersonName: adminName,
        authorisedPersonDesignation: "President / Secretary",
      })
      .onConflictDoNothing({ target: settings.id });

    // 5b. Insert Initial Super Admin
    console.log(`-> Creating initial Super Admin (${adminName}, Mobile: ${adminMobile})...`);
    const [createdAdmin] = await tx
      .insert(users)
      .values({
        name: adminName,
        mobile: adminMobile,
        passwordHash,
        role: "super_admin",
        permissions: ["ALL"],
        isActive: true,
        mustChangePassword: true, // Requires mandatory password change on first login
      })
      .returning({ id: users.id });

    // 5c. Seed Locations
    if (locationsToSeed.length > 0) {
      console.log(`-> Seeding ${locationsToSeed.length} initial locations...`);
      for (const loc of locationsToSeed) {
        if (!loc.name) continue;
        await tx
          .insert(locations)
          .values({
            name: loc.name.trim(),
            pincode: loc.pincode?.trim() || null,
            isActive: true,
          })
          .onConflictDoNothing();
      }
    }

    // 5d. Write Audit Log (actor null, action 'system.seed')
    console.log("-> Recording audit log for system seed...");
    await tx.insert(auditLogs).values({
      actorId: null, // Null for automated system actions
      action: "system.seed",
      entityType: "system",
      entityId: createdAdmin.id,
      newValue: {
        adminUserId: createdAdmin.id,
        adminMobile,
        adminName,
        settingsId: 1,
        locationsSeededCount: locationsToSeed.length,
      },
      reason: "Initial system seeding and Super Admin provision",
    });
  });

  console.log("\n✅ Database seed completed successfully!");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

