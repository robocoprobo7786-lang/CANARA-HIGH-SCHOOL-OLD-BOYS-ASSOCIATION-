"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { users } from "../../db/schema";
import { requireUser } from "../auth/authorisation";
import { writeAudit } from "../audit";
import { revalidatePath } from "next/cache";

const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  designation: z.string().optional(),
});

export type ProfileActionResult =
  | { success: true; message: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Staff Self-Service: Update Own Profile (FRS §3.2)
 * Staff are permitted to edit their own name/designation and password only.
 */
export async function updateOwnProfileAction(
  _prevState: unknown,
  formData: FormData
): Promise<ProfileActionResult> {
  const user = await requireUser();

  const parsed = UpdateProfileSchema.safeParse({
    name: formData.get("name")?.toString().trim() || "",
    designation: formData.get("designation")?.toString().trim() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct profile input errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const [current] = await db
    .select({ name: users.name, designation: users.designation })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        name: parsed.data.name,
        designation: parsed.data.designation || null,
      })
      .where(eq(users.id, user.id));

    await writeAudit(tx, {
      actorId: user.id,
      action: "user.profile_update",
      entityType: "user",
      entityId: user.id,
      oldValue: current,
      newValue: { name: parsed.data.name, designation: parsed.data.designation || null },
      reason: "User updated own profile information",
    });
  });

  revalidatePath("/settings");
  return { success: true, message: "Profile updated successfully." };
}

