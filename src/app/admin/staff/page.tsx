import { db } from "@/server/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StaffManagementClient } from "./client";

export default async function AdminStaffPage() {
  const staffList = await db
    .select({
      id: users.id,
      name: users.name,
      mobile: users.mobile,
      designation: users.designation,
      role: users.role,
      permissions: users.permissions,
      isActive: users.isActive,
      mustChangePassword: users.mustChangePassword,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "counter_staff"))
    .orderBy(users.createdAt);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-[#123D70]">Counter Staff Accounts</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage front-desk staff accounts, credentials, and access permissions (FRS §3.1, §4).
          </p>
        </div>
      </div>

      <StaffManagementClient staffList={staffList} />
    </div>
  );
}

