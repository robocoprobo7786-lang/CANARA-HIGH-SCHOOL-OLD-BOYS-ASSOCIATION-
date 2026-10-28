"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { locations } from "../../db/schema";
import { requireRole } from "../auth/authorisation";
import { writeAudit } from "../audit";
import { revalidatePath } from "next/cache";

const AddLocationSchema = z.object({
  name: z.string().min(2, "Location name must be at least 2 characters"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits").optional().or(z.literal("")),
});

const RenameLocationSchema = z.object({
  locationId: z.string().uuid("Invalid location ID"),
  name: z.string().min(2, "Location name must be at least 2 characters"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits").optional().or(z.literal("")),
});

export type LocationActionResult =
  | { success: true; message: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Super Admin: Add new Location (FRS §5.2)
 * Enforces case-insensitive uniqueness.
 */
export async function addLocationAction(
  _prevState: unknown,
  formData: FormData
): Promise<LocationActionResult> {
  const admin = await requireRole("super_admin");

  const parsed = AddLocationSchema.safeParse({
    name: formData.get("name")?.toString().trim() || "",
    pincode: formData.get("pincode")?.toString().trim() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Check case-insensitive duplicate
  const [existing] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(sql`lower(${locations.name}) = lower(${parsed.data.name})`)
    .limit(1);

  if (existing) {
    return {
      success: false,
      error: `Location "${parsed.data.name}" already exists.`,
      fieldErrors: { name: ["Location with this name already exists."] },
    };
  }

  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(locations)
      .values({
        name: parsed.data.name,
        pincode: parsed.data.pincode || null,
        isActive: true,
      })
      .returning();

    await writeAudit(tx, {
      actorId: admin.id,
      action: "location.add",
      entityType: "location",
      entityId: created.id,
      newValue: { name: created.name, pincode: created.pincode },
      reason: "Super Admin added new central location",
    });
  });

  revalidatePath("/admin/locations");
  return { success: true, message: `Location "${parsed.data.name}" added successfully.` };
}

/**
 * Super Admin: Rename/Edit Location (FRS §5.2)
 */
export async function renameLocationAction(
  _prevState: unknown,
  formData: FormData
): Promise<LocationActionResult> {
  const admin = await requireRole("super_admin");

  const parsed = RenameLocationSchema.safeParse({
    locationId: formData.get("locationId")?.toString() || "",
    name: formData.get("name")?.toString().trim() || "",
    pincode: formData.get("pincode")?.toString().trim() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const [current] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, parsed.data.locationId))
    .limit(1);

  if (!current) {
    return { success: false, error: "Location not found." };
  }

  // Check if new name conflicts with an existing one (case-insensitive)
  const [duplicate] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      sql`lower(${locations.name}) = lower(${parsed.data.name}) AND ${locations.id} <> ${parsed.data.locationId}`
    )
    .limit(1);

  if (duplicate) {
    return {
      success: false,
      error: `Another location named "${parsed.data.name}" already exists.`,
      fieldErrors: { name: ["Location name already taken."] },
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(locations)
      .set({
        name: parsed.data.name,
        pincode: parsed.data.pincode || null,
      })
      .where(eq(locations.id, parsed.data.locationId));

    await writeAudit(tx, {
      actorId: admin.id,
      action: "location.update",
      entityType: "location",
      entityId: parsed.data.locationId,
      oldValue: { name: current.name, pincode: current.pincode },
      newValue: { name: parsed.data.name, pincode: parsed.data.pincode || null },
      reason: "Super Admin updated location details",
    });
  });

  revalidatePath("/admin/locations");
  return { success: true, message: `Location updated successfully.` };
}

/**
 * Super Admin: Toggle Location Active/Deactivated (FRS §5.2)
 */
export async function toggleLocationActiveAction(
  locationId: string,
  targetActive: boolean
): Promise<LocationActionResult> {
  const admin = await requireRole("super_admin");

  const [current] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);

  if (!current) {
    return { success: false, error: "Location not found." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(locations)
      .set({ isActive: targetActive })
      .where(eq(locations.id, locationId));

    await writeAudit(tx, {
      actorId: admin.id,
      action: targetActive ? "location.activate" : "location.deactivate",
      entityType: "location",
      entityId: locationId,
      oldValue: { isActive: current.isActive },
      newValue: { isActive: targetActive },
      reason: `Super Admin ${targetActive ? "activated" : "deactivated"} location`,
    });
  });

  revalidatePath("/admin/locations");
  return {
    success: true,
    message: `Location "${current.name}" has been ${targetActive ? "activated" : "deactivated"}.`,
  };
}

