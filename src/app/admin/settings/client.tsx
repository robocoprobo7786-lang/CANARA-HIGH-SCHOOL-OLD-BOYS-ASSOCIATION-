"use client";

import { useActionState, useState } from "react";
import { updateSettingsAction } from "@/server/admin/settings-actions";

interface SettingsData {
  associationName: string;
  addressLine: string;
  phone: string;
  email: string;
  membershipFee: string;
  authorisedPersonName: string | null;
  authorisedPersonDesignation: string | null;
}

export function SettingsFormClient({ initialSettings }: { initialSettings?: SettingsData }) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const res = await updateSettingsAction(prev, formData);
      if (res.success) {
        setSuccessMsg(res.message);
      }
      return res;
    },
    null
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg">
          {successMsg}
        </div>
      )}

      {!state?.success && state?.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div className="border-b pb-5">
          <h2 className="text-base font-bold text-[#123D70] mb-4">Official Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Association Full Name
              </label>
              <input
                name="associationName"
                defaultValue={initialSettings?.associationName || ""}
                required
                className="w-full px-3.5 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Official Postal Address
              </label>
              <textarea
                name="addressLine"
                rows={2}
                defaultValue={initialSettings?.addressLine || ""}
                required
                className="w-full px-3.5 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                name="phone"
                defaultValue={initialSettings?.phone || ""}
                required
                className="w-full px-3.5 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                name="email"
                type="email"
                defaultValue={initialSettings?.email || ""}
                required
                className="w-full px-3.5 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border-b pb-5">
          <h2 className="text-base font-bold text-[#123D70] mb-4">Financial Configuration</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Membership Fee (₹ Rupees)
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-3.5 top-2 text-gray-500 font-semibold text-sm">₹</span>
              <input
                name="membershipFee"
                defaultValue={initialSettings?.membershipFee || "1000.00"}
                required
                className="w-full pl-8 pr-3.5 py-2 border rounded-lg text-sm font-semibold text-gray-900"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Applies to future membership approvals (FRS §5.5).
            </p>
          </div>
        </div>

        <div className="pb-2">
          <h2 className="text-base font-bold text-[#123D70] mb-4">Receipt Signatory Details</h2>
          <p className="text-xs text-gray-500 mb-3">
            Printed on issued membership and donation receipts (FRS §8.2).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Authorised Person Name
              </label>
              <input
                name="authorisedPersonName"
                defaultValue={initialSettings?.authorisedPersonName || ""}
                required
                placeholder="e.g. Dr. K. Ramanath Kamath"
                className="w-full px-3.5 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Designation / Title
              </label>
              <input
                name="authorisedPersonDesignation"
                defaultValue={initialSettings?.authorisedPersonDesignation || ""}
                required
                placeholder="e.g. Honorary Secretary"
                className="w-full px-3.5 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-[#123D70] hover:bg-[#0e2f57] text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

