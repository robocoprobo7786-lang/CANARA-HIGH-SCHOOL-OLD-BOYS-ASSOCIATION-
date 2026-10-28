"use client";

import { useActionState, useState } from "react";
import {
  createStaffAction,
  toggleStaffActiveAction,
  resetStaffPasswordAction,
  updateStaffPermissionsAction,
} from "@/server/admin/staff-actions";

interface StaffItem {
  id: string;
  name: string;
  mobile: string;
  designation: string | null;
  role: string;
  permissions: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

const AVAILABLE_PERMISSIONS = [
  { key: "members.create", label: "Create Applications" },
  { key: "payments.record", label: "Record Fee Payments" },
  { key: "receipts.issue", label: "Issue Initial Receipts" },
  { key: "donors.manage", label: "Manage Endowment Donors" },
];

export function StaffManagementClient({ staffList }: { staffList: StaffItem[] }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [permTarget, setPermTarget] = useState<StaffItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Create Staff Form Action State
  const [createState, createFormAction, isCreating] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const res = await createStaffAction(prev, formData);
      if (res.success) {
        setShowCreateModal(false);
        setStatusMessage(res.message || "Staff account created.");
      }
      return res;
    },
    null
  );

  // Reset Password Action State
  const [resetState, resetFormAction, isResetting] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const res = await resetStaffPasswordAction(prev, formData);
      if (res.success) {
        setResetTargetId(null);
        setStatusMessage(res.message || "Password reset successfully.");
      }
      return res;
    },
    null
  );

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex justify-between items-center">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <span className="text-sm font-semibold text-gray-700">
            Total Staff Members: {staffList.length}
          </span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#123D70] hover:bg-[#0e2f57] text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
        >
          <span>＋</span> Add Counter Staff
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Name / Designation</th>
              <th className="py-3.5 px-4">Mobile Number</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Permissions</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staffList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No counter staff accounts found. Click "Add Counter Staff" to create one.
                </td>
              </tr>
            ) : (
              staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-gray-900">{staff.name}</p>
                    <p className="text-xs text-gray-500">{staff.designation || "Counter Staff"}</p>
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 font-mono text-xs">{staff.mobile}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        staff.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {staff.isActive ? "Active" : "Disabled"}
                    </span>
                    {staff.mustChangePassword && (
                      <span className="ml-2 text-amber-600 text-[10px] font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Password Reset Required
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {staff.permissions && staff.permissions.length > 0 ? (
                        staff.permissions.map((p) => (
                          <span
                            key={p}
                            className="text-[11px] bg-blue-50 text-[#123D70] font-medium px-2 py-0.5 rounded border border-blue-100"
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">Standard counter access</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => setPermTarget(staff)}
                      className="text-xs font-medium text-blue-700 hover:text-blue-900 cursor-pointer"
                    >
                      Permissions
                    </button>

                    <button
                      onClick={() => setResetTargetId(staff.id)}
                      className="text-xs font-medium text-amber-700 hover:text-amber-900 cursor-pointer"
                    >
                      Reset Password
                    </button>

                    <button
                      onClick={async () => {
                        const confirmMsg = staff.isActive
                          ? `Disable account for ${staff.name}? They will be immediately signed out.`
                          : `Re-enable account for ${staff.name}?`;
                        if (confirm(confirmMsg)) {
                          const res = await toggleStaffActiveAction(staff.id, !staff.isActive);
                          if (res.success) setStatusMessage(res.message || "Updated");
                        }
                      }}
                      className={`text-xs font-semibold cursor-pointer ${
                        staff.isActive
                          ? "text-red-600 hover:text-red-800"
                          : "text-emerald-600 hover:text-emerald-800"
                      }`}
                    >
                      {staff.isActive ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Staff */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-[#123D70] mb-1">Add Counter Staff Account</h2>
            <p className="text-xs text-gray-500 mb-4">
              Create login credentials. The user will be required to change this temporary password on first login.
            </p>

            {!createState?.success && createState?.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {createState.error}
              </div>
            )}

            <form action={createFormAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Ramesh Prabhu"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Primary Mobile Number
                </label>
                <input
                  name="mobile"
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Designation / Role Description (Optional)
                </label>
                <input
                  name="designation"
                  placeholder="e.g. Front Desk Operator"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Temporary Password (min 8 chars)
                </label>
                <input
                  name="temporaryPassword"
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Assigned Capabilities
                </label>
                <div className="space-y-1.5">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        name="permissions"
                        value={perm.key}
                        defaultChecked
                        className="rounded text-[#123D70]"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-[#123D70] hover:bg-[#0e2f57] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetTargetId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-[#123D70] mb-1">Admin-Assisted Password Reset</h2>
            <p className="text-xs text-gray-500 mb-4">
              Enter a new temporary password. The staff member will be required to change it immediately upon login.
            </p>

            <form action={resetFormAction} className="space-y-4">
              <input type="hidden" name="userId" value={resetTargetId} />
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  New Temporary Password
                </label>
                <input
                  name="temporaryPassword"
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setResetTargetId(null)}
                  className="px-3 py-1.5 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-3 py-1.5 bg-[#123D70] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isResetting ? "Resetting..." : "Set Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Permissions */}
      {permTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-[#123D70] mb-1">
              Update Permissions: {permTarget.name}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Select allowed actions for this counter staff account.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const checked = Array.from(
                  form.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked")
                ).map((c) => c.value);

                const res = await updateStaffPermissionsAction(permTarget.id, checked);
                if (res.success) {
                  setPermTarget(null);
                  setStatusMessage("Permissions updated successfully.");
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <label key={perm.key} className="flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      value={perm.key}
                      defaultChecked={permTarget.permissions.includes(perm.key)}
                      className="rounded text-[#123D70]"
                    />
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setPermTarget(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#123D70] text-white rounded-lg text-xs font-semibold"
                >
                  Save Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

