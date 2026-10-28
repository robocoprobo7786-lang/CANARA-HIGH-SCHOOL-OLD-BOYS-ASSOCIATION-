"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { users } from "../../db/schema";
import { writeAudit } from "../audit";
import {
  createSession,
  invalidateSession,
  invalidateAllUserSessions,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "./session";
import { normalizeMobileNumber } from "./phone";
import { getCurrentUser, requireUser } from "./authorisation";

// Security parameters
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const GENERIC_AUTH_ERROR = "Invalid mobile number or password.";

const LoginSchema = z.object({
  mobile: z.string().min(1, "Mobile number is required"),
  password: z.string().min(1, "Password is required"),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});

export type AuthActionResult<T = void> =
  | { success: true; data?: T; redirectUrl?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Server Action: Process Login
 */
export async function loginAction(
  _prevState: unknown,
  formData: FormData
): Promise<AuthActionResult<{ mustChangePassword: boolean; role: string }>> {
  const rawMobile = formData.get("mobile")?.toString() || "";
  const rawPassword = formData.get("password")?.toString() || "";

  const parsed = LoginSchema.safeParse({ mobile: rawMobile, password: rawPassword });
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check your inputs.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const normalizedMobile = normalizeMobileNumber(parsed.data.mobile);
  if (!normalizedMobile) {
    return {
      success: false,
      error: GENERIC_AUTH_ERROR,
    };
  }

  const now = new Date();

  // 1. Fetch user by mobile
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.mobile, normalizedMobile))
    .limit(1);

  if (!user) {
    // Audit failed login attempt (unknown user)
    await db.transaction(async (tx) => {
      await writeAudit(tx, {
        actorId: null,
        action: "auth.login_failed",
        entityType: "user",
        entityId: null,
        metadata: { mobile: normalizedMobile, reason: "User not found" },
      });
    });
    return { success: false, error: GENERIC_AUTH_ERROR };
  }

  // 2. Check if account is locked
  if (user.lockedUntil && user.lockedUntil > now) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / (60 * 1000));
    return {
      success: false,
      error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minute(s).`,
    };
  }

  // 3. Check if account is active
  if (!user.isActive) {
    return {
      success: false,
      error: "This account has been disabled. Please contact the Super Admin.",
    };
  }

  // 4. Verify password
  const passwordMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!passwordMatch) {
    const newFailedCount = user.failedLoginCount + 1;
    let lockedUntilDate: Date | null = null;
    let isNowLocked = false;

    if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
      lockedUntilDate = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
      isNowLocked = true;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          failedLoginCount: newFailedCount,
          lockedUntil: lockedUntilDate,
        })
        .where(eq(users.id, user.id));

      await writeAudit(tx, {
        actorId: user.id,
        action: isNowLocked ? "auth.account_locked" : "auth.login_failed",
        entityType: "user",
        entityId: user.id,
        metadata: {
          mobile: normalizedMobile,
          failedCount: newFailedCount,
          lockedUntil: lockedUntilDate,
        },
      });
    });

    if (isNowLocked) {
      return {
        success: false,
        error: `Account is temporarily locked due to multiple failed attempts. Please try again in ${LOCKOUT_MINUTES} minutes.`,
      };
    }

    return { success: false, error: GENERIC_AUTH_ERROR };
  }

  // 5. Successful login: reset failed counter, update lastLoginAt, create session
  const { token, expiresAt } = await createSession(user.id);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: now,
      })
      .where(eq(users.id, user.id));

    await writeAudit(tx, {
      actorId: user.id,
      action: "auth.login_success",
      entityType: "user",
      entityId: user.id,
      metadata: { role: user.role },
    });
  });

  // Set HTTP-Only Cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  const redirectUrl = user.mustChangePassword
    ? "/settings/password"
    : user.role === "super_admin"
    ? "/admin/dashboard"
    : "/dashboard";

  return {
    success: true,
    redirectUrl,
    data: {
      mustChangePassword: user.mustChangePassword,
      role: user.role,
    },
  };
}

/**
 * Server Action: Process Logout
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const user = await getCurrentUser();
    await invalidateSession(token);

    if (user) {
      await db.transaction(async (tx) => {
        await writeAudit(tx, {
          actorId: user.id,
          action: "auth.logout",
          entityType: "user",
          entityId: user.id,
        });
      });
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Server Action: Change Password
 */
export async function changePasswordAction(
  _prevState: unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const user = await requireUser();

  const currentPassword = formData.get("currentPassword")?.toString() || "";
  const newPassword = formData.get("newPassword")?.toString() || "";
  const confirmPassword = formData.get("confirmPassword")?.toString() || "";

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword,
    newPassword,
    confirmPassword,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // 1. Fetch current user row for password hash check
  const [dbUser] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser) {
    return { success: false, error: "User record not found." };
  }

  const validCurrent = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
  if (!validCurrent) {
    return {
      success: false,
      error: "Current password is incorrect.",
      fieldErrors: { currentPassword: ["Current password is incorrect."] },
    };
  }

  // Hash new password
  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);

  // 2. Update user and invalidate all other sessions (keep current session or re-authenticate)
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
      })
      .where(eq(users.id, user.id));

    await writeAudit(tx, {
      actorId: user.id,
      action: "auth.password_change",
      entityType: "user",
      entityId: user.id,
      reason: "User updated password",
    });
  });

  const redirectUrl = user.role === "super_admin" ? "/admin/dashboard" : "/dashboard";

  return {
    success: true,
    redirectUrl,
  };
}

