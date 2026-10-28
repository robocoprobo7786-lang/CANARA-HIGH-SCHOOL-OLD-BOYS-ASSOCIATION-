"use server";

import { requireRole } from "./authorisation";

/**
 * Server action restricted to Super Admin.
 * Used to verify role enforcement.
 */
export async function adminOnlyServerAction(): Promise<{ success: boolean; data?: string }> {
  const admin = await requireRole("super_admin");
  return {
    success: true,
    data: `Access granted for Super Admin: ${admin.name}`,
  };
}

