import { sql } from "drizzle-orm";
import type { Transaction } from "./db";

/**
 * Atomically increments and returns the next sequential integer for a given key.
 * If the key does not exist, it is initialized with value 1.
 * 
 * Runs within the provided database transaction `tx`.
 * FRS §5.4 (CHSOBA ID sequential allocation) & FRS §8.1 (Receipt numbering sequence).
 * 
 * @param tx - The active database transaction
 * @param key - The sequence key (e.g. 'member_id', 'receipt:membership:2026', 'receipt:endowment:2026')
 * @returns The newly allocated integer sequence number
 */
export async function nextSequence(tx: Transaction, key: string): Promise<number> {
  const result = await tx.execute(sql<{ value: number }>`
    INSERT INTO "counters" ("key", "value")
    VALUES (${key}, 1)
    ON CONFLICT ("key")
    DO UPDATE SET "value" = "counters"."value" + 1
    RETURNING "value";
  `);

  const row = result.rows[0];
  if (!row || typeof row.value !== "number") {
    throw new Error(`Failed to allocate next sequence for key: ${key}`);
  }

  return row.value;
}

