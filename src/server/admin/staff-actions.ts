"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { users } from "../../db/schema";
import { requireRole } from "../auth/authorisation";
import { writeAudit } from "../audit";
import { normalizeMobileNumber } from "../auth/phone";
import { invalidateAllUserSessions } from "../auth/session";
import { revalidatePath } from "next/cache";

const CreateStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().min(10, "Valid 10-digit mobile number required"),
  designation: z.string().optional(),
  temporaryPassword: z.string().min(8, "Temporary password must be at least 8 characters"),
  permissions: z.array(z.string()).default([]),
});

const ResetPasswordSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  temporaryPassword: z.string().min(8, "Temporary password must be at least 8 characters"),
});

const UpdatePermissionsSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  permissions: z.array(z.string()),
});

export type AdminActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Super Admin: Create Staff Account (FRS §3.1, §4)
 */
export async function createStaffAction(
  _prevState: unknown,
  formData: FormData
): Promise<AdminActionResult<{ id: string }>> {
  const admin = await requireRole("super_admin");

  const rawPermissions = formData.getAll("permissions").map((p) => p.toString());
  const parsed = CreateStaffSchema.safeParse({
    name: formData.get("name")?.toString() || "",
    mobile: formData.get("mobile")?.toString() || "",
    designation: formData.get("designation")?.toString() || undefined,
    temporaryPassword: formData.get("temporaryPassword")?.toString() || "",
    permissions: rawPermissions,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const normalizedMobile = normalizeMobileNumber(parsed.data.mobile);
  if (!normalizedMobile) {
    return {
      success: false,
      error: "Invalid Indian mobile number. Must be 10 digits.",
      fieldErrors: { mobile: ["Invalid Indian mobile number."] },
    };
  }

  // Check unique mobile
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.mobile, normalizedMobile))
    .limit(1);

  if (existing) {
    return {
      success: false,
      error: "An account with this mobile number already exists.",
      fieldErrors: { mobile: ["Mobile number already registered."] },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.temporaryPassword, 12);

  const [created] = await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({
        name: parsed.data.name,
        mobile: normalizedMobile,
        designation: parsed.data.designation || null,
        passwordHash,
        role: "counter_staff",
        permissions: parsed.data.permissions,
        isActive: true,
        mustChangePassword: true, // Forces password change on first login (FRS §4)
        createdBy: admin.id,
      })
      .returning({ id: users.id, name: users.name, mobile: users.mobile });

    await writeAudit(tx, {
      actorId: admin.id,
      action: "staff.create",
      entityType: "user",
      entityId: newUser.id,
      newValue: {
        id: newUser.id,
        name: newUser.name,
        mobile: newUser.mobile,
        role: "counter_staff",
        permissions: parsed.data.permissions,
        mustChangePassword: true,
      },
      reason: "Super Admin created counter staff account",
    });

    return [newUser];
  });

  revalidatePath("/admin/staff");
  return {
    success: true,
    data: { id: created.id },
    message: `Counter staff account created for ${created.name}.`,
  };
}

/**
 * Super Admin: Toggle Staff Active/Disabled (FRS §3.1, §4)
 */
export async function toggleStaffActiveAction(
  userId: string,
  targetActive: boolean
): Promise<AdminActionResult> {
  const admin = await requireRole("super_admin");

  if (userId === admin.id) {
    return { success: false, error: "Cannot disable your own Super Admin account." };
  }

  const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!targetUser) {
    return { success: false, error: "Staff member not found." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ isActive: targetActive })
      .where(eq(users.id, userId));

    await writeAudit(tx, {
      actorId: admin.id,
      action: targetActive ? "staff.enable" : "staff.disable",
      entityType: "user",
      entityId: userId,
      oldValue: { isActive: targetUser.isActive },
      newValue: { isActive: targetActive },
      reason: `Staff account ${targetActive ? "enabled" : "disabled"} by Super Admin`,
    });
  });

  // If disabled, immediately invalidate all active sessions (FRS §4)
  if (!targetActive) {
    await invalidateAllUserSessions(userId);
  }

  revalidatePath("/admin/staff");
  return { success: true, message: `Account has been ${targetActive ? "enabled" : "disabled"}.` };
}

/**
 * Super Admin: Reset Staff Password (Admin-assisted recovery per FRS §4)
 */
export async function resetStaffPasswordAction(
  _prevState: unknown,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireRole("super_admin");

  const parsed = ResetPasswordSchema.safeParse({
    userId: formData.get("userId")?.toString() || "",
    temporaryPassword: formData.get("temporaryPassword")?.toString() || "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const [targetUser] = await db.select().from(users).where(eq(users.id, parsed.data.userId)).limit(1);
  if (!targetUser) {
    return { success: false, error: "Staff member not found." };
  }

  const newHash = await bcrypt.hash(parsed.data.temporaryPassword, 12);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: true, // Forces password change on login
        failedLoginCount: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, parsed.data.userId));

    await writeAudit(tx, {
      actorId: admin.id,
      action: "staff.password_reset",
      entityType: "user",
      entityId: parsed.data.userId,
      reason: "Admin-assisted password reset",
    });
  });

  // Invalidate past sessions
  await invalidateAllUserSessions(parsed.data.userId);

  revalidatePath("/admin/staff");
  return {
    success: true,
    message: `Password reset successfully. The user will be required to change it on next login.`,
  };
}

/**
 * Super Admin: Update Staff Permissions (FRS §3.1)
 */
export async function updateStaffPermissionsAction(
  userId: string,
  newPermissions: string[]
): Promise<AdminActionResult> {
  const admin = await requireRole("super_admin");

  const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!targetUser) {
    return { success: false, error: "Staff member not found." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ permissions: newPermissions })
      .where(eq(users.id, userId));

    await writeAudit(tx, {
      actorId: admin.id,
      action: "staff.permissions_update",
      entityType: "user",
      entityId: userId,
      oldValue: { permissions: targetUser.permissions },
      newValue: { permissions: newPermissions },
      reason: "Super Admin updated permissions",
    });
  });

  revalidatePath("/admin/staff");
  return { success: true, message: "Permissions updated successfully." };
}
