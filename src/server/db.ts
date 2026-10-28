import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { config } from "dotenv";
import * as schema from "../db/schema";

config({ path: ".env.local" });

/**
 * Neon Serverless Driver Choice:
 * Neon HTTP driver (@neondatabase/serverless neon() + drizzle neon-http) is stateless and sends queries
 * via HTTP requests. It DOES NOT support stateful interactive database transactions across multiple queries,
 * nor does it support connection-level row locking with `SELECT ... FOR UPDATE`.
 * 
 * Therefore, we use Neon Serverless `Pool` with WebSocket support (`neon-serverless`),
 * which maintains persistent, interactive WebSocket connections capable of standard multi-query
 * transactions (`db.transaction(async (tx) => { ... })`) and lock acquisitions.
 */

// Configure WebSocket for Node.js environments (Next.js server runtime / test scripts)
if (!neonConfig.webSocketConstructor) {
  neonConfig.webSocketConstructor = ws;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

// Global pool cache to prevent connection leak in Next.js development hot-reloading
const globalForDb = globalThis as unknown as {
  neonPool: Pool | undefined;
};

export const pool =
  globalForDb.neonPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.neonPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
