"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { settings } from "../../db/schema";
import { requireRole } from "../auth/authorisation";
import { writeAudit } from "../audit";
import { rupeesToPaise, paiseToRupees } from "../money";
import { revalidatePath } from "next/cache";

const UpdateSettingsSchema = z.object({
  associationName: z.string().min(3, "Association name is required"),
  addressLine: z.string().min(5, "Address line is required"),
  phone: z.string().min(5, "Contact phone is required"),
  email: z.string().email("Valid email address is required"),
  membershipFee: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valid currency amount required"),
  authorisedPersonName: z.string().min(2, "Signatory name is required"),
  authorisedPersonDesignation: z.string().min(2, "Signatory designation is required"),
});

export type SettingsActionResult =
  | { success: true; message: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Super Admin: Update Association Settings & Membership Fee (FRS §5.5, §8.2)
 * Note: Changing the fee applies to future application approvals only; does not retroactively change existing approved records.
 */
export async function updateSettingsAction(
  _prevState: unknown,
  formData: FormData
): Promise<SettingsActionResult> {
  const admin = await requireRole("super_admin");

  const parsed = UpdateSettingsSchema.safeParse({
    associationName: formData.get("associationName")?.toString() || "",
    addressLine: formData.get("addressLine")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    email: formData.get("email")?.toString() || "",
    membershipFee: formData.get("membershipFee")?.toString() || "",
    authorisedPersonName: formData.get("authorisedPersonName")?.toString() || "",
    authorisedPersonDesignation: formData.get("authorisedPersonDesignation")?.toString() || "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the settings form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Format fee using zero-float money helpers
  const feeDecimal = paiseToRupees(rupeesToPaise(parsed.data.membershipFee));

  const [current] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);

  await db.transaction(async (tx) => {
    await tx
      .update(settings)
      .set({
        associationName: parsed.data.associationName,
        addressLine: parsed.data.addressLine,
        phone: parsed.data.phone,
        email: parsed.data.email,
        membershipFee: feeDecimal,
        authorisedPersonName: parsed.data.authorisedPersonName,
        authorisedPersonDesignation: parsed.data.authorisedPersonDesignation,
        updatedBy: admin.id,
        updatedAt: new Date(),
      })
      .where(eq(settings.id, 1));

    await writeAudit(tx, {
      actorId: admin.id,
      action: "settings.update",
      entityType: "settings",
      entityId: "1",
      oldValue: current
        ? {
            associationName: current.associationName,
            addressLine: current.addressLine,
            phone: current.phone,
            email: current.email,
            membershipFee: current.membershipFee,
            authorisedPersonName: current.authorisedPersonName,
            authorisedPersonDesignation: current.authorisedPersonDesignation,
          }
        : null,
      newValue: {
        associationName: parsed.data.associationName,
        addressLine: parsed.data.addressLine,
        phone: parsed.data.phone,
        email: parsed.data.email,
        membershipFee: feeDecimal,
        authorisedPersonName: parsed.data.authorisedPersonName,
        authorisedPersonDesignation: parsed.data.authorisedPersonDesignation,
      },
      reason: "Super Admin updated association settings & fee configuration",
    });
  });

  revalidatePath("/admin/settings");
  return { success: true, message: "Association settings saved successfully." };
}

