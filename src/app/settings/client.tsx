"use client";

import { useActionState, useState } from "react";
import { updateOwnProfileAction } from "@/server/staff/profile-actions";
import { changePasswordAction } from "@/server/auth/actions";
import type { SessionUser } from "@/server/auth/session";

export function StaffSelfServiceClient({ user }: { user: SessionUser }) {
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [passMsg, setPassMsg] = useState<string | null>(null);

  // Profile action state
  const [profileState, profileFormAction, isUpdatingProfile] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const res = await updateOwnProfileAction(prev, formData);
      if (res.success) setProfileMsg(res.message);
      return res;
    },
    null
  );

  // Password action state
  const [passState, passFormAction, isUpdatingPass] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const res = await changePasswordAction(prev, formData);
      if (res.success) setPassMsg("Password successfully updated.");
      return res;
    },
    null
  );

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-[#123D70] mb-1">Personal Details</h2>
        <p className="text-xs text-gray-500 mb-4">
          Your mobile number is managed by the Super Admin and cannot be changed here (FRS §5.6).
        </p>

        {profileMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
            {profileMsg}
          </div>
        )}
        {!profileState?.success && profileState?.error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
            {profileState.error}
          </div>
        )}

        <form action={profileFormAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              name="name"
              defaultValue={user.name}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Registered Mobile Number
            </label>
            <input
              value={user.mobile}
              disabled
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Designation / Title
            </label>
            <input
              name="designation"
              defaultValue={user.designation || ""}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-4 py-2 bg-[#123D70] hover:bg-[#0e2f57] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isUpdatingProfile ? "Saving..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Password Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-[#123D70] mb-1">Change Password</h2>
        <p className="text-xs text-gray-500 mb-4">Update your login security credentials.</p>

        {passMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
            {passMsg}
          </div>
        )}
        {!passState?.success && passState?.error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
            {passState.error}
          </div>
        )}

        <form action={passFormAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Current Password
            </label>
            <input
              name="currentPassword"
              type="password"
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
            <input
              name="newPassword"
              type="password"
              required
              minLength={8}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPass}
              className="px-4 py-2 bg-[#123D70] hover:bg-[#0e2f57] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isUpdatingPass ? "Updating Password..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

