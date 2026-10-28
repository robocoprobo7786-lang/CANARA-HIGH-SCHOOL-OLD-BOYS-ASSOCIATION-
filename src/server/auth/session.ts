import crypto from "crypto";
import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db";
import { users, sessions, userRole } from "../../db/schema";

export const SESSION_COOKIE_NAME = "chsoba_session";
// 7 days sliding window
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
// Refresh sliding expiry if remaining time is under 3 days
export const SESSION_REFRESH_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * SHA-256 hash of a raw session token.
 * Only the hash is stored in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type UserRole = "super_admin" | "counter_staff";

export interface SessionUser {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  designation: string | null;
  permissions: string[];
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface SessionResult {
  user: SessionUser;
  sessionId: string;
  expiresAt: Date;
}

/**
 * Creates a new cryptographically secure session for a user.
 */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString("hex");
  const sessionId = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Validates a session token string against the database.
 * Non-negotiable rule & FRS §4:
 * Every validation re-checks that the user exists and is_active = true.
 * Disabling an account takes immediate effect.
 */
export async function validateSessionToken(token: string): Promise<SessionResult | null> {
  const sessionId = hashToken(token);
  const now = new Date();

  // Join sessions with users to fetch active user state in one query
  const rows = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      user: {
        id: users.id,
        name: users.name,
        mobile: users.mobile,
        role: users.role,
        designation: users.designation,
        permissions: users.permissions,
        isActive: users.isActive,
        mustChangePassword: users.mustChangePassword,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  // Check if account has been disabled (FRS §4)
  if (!row.user.isActive) {
    // Delete session immediately
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }

  // Sliding expiry: if under threshold, extend
  if (row.expiresAt.getTime() - now.getTime() < SESSION_REFRESH_THRESHOLD_MS) {
    const newExpiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
    await db
      .update(sessions)
      .set({ expiresAt: newExpiresAt })
      .where(eq(sessions.id, sessionId));
    row.expiresAt = newExpiresAt;
  }

  return {
    user: row.user as SessionUser,
    sessionId: row.sessionId,
    expiresAt: row.expiresAt,
  };
}

/**
 * Invalidate a session by token.
 */
export async function invalidateSession(token: string): Promise<void> {
  const sessionId = hashToken(token);
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Invalidate all sessions for a specific user (e.g., when password changes or account disabled).
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

