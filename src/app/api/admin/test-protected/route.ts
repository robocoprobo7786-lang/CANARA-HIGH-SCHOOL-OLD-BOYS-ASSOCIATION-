import { requireRole } from "@/server/auth/authorisation";
import { NextResponse } from "next/server";

/**
 * Example administrative API route handler.
 * Strictly checks `requireRole('super_admin')`.
 */
export async function GET() {
  try {
    const admin = await requireRole("super_admin");
    return NextResponse.json({
      success: true,
      message: "Admin authorization granted.",
      adminId: admin.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Forbidden" },
      { status: err.status || 403 }
    );
  }
}

