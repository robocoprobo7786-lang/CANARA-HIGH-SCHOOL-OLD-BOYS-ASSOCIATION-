import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, validateSessionToken, type SessionUser } from "./session";

export class AuthError extends Error {
  constructor(message: string, public status: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Retrieves the currently authenticated user from session cookies.
 * Returns null if not logged in or invalid/expired session.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const result = await validateSessionToken(token);
  return result ? result.user : null;
}

/**
 * Requires a logged-in user. Throws AuthError(401) if unauthenticated.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Authentication required.", 401);
  }
  return user;
}

/**
 * Requires the logged-in user to have a specific role (e.g. 'super_admin').
 * Throws AuthError(401) if not logged in, or AuthError(403) if insufficient permissions.
 * FRS §3 & Non-negotiable Rule #1.
 */
export async function requireRole(role: SessionUser["role"]): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) {
    throw new AuthError(`Forbidden: Requires '${role}' role.`, 403);
  }
  return user;
}

/**
 * Requires a user to have a specific permission in their permissions list (or super_admin).
 */
export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === "super_admin") {
    return user;
  }
  if (!user.permissions || !user.permissions.includes(permission)) {
    throw new AuthError(`Forbidden: Missing permission '${permission}'.`, 403);
  }
  return user;
}

