"use client";

import { useActionState, useState } from "react";
import { changePasswordAction } from "@/server/auth/actions";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const res = await changePasswordAction(prevState, formData);
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
        return res;
      }
      if (!res.success) {
        setErrorMsg(res.error);
      }
      return res;
    },
    null
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF1F8] px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-[#123D70]/10 overflow-hidden">
        <div className="bg-[#123D70] p-6 text-white text-center">
          <h1 className="text-xl font-bold tracking-tight mb-1 text-white">
            Set New Password
          </h1>
          <p className="text-xs text-[#EAF1F8]/80 font-medium">
            Please choose a secure personal password to continue.
          </p>
        </div>

        <div className="p-8">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-semibold text-[#123D70] mb-1.5"
              >
                Current / Temporary Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123D70]"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-semibold text-[#123D70] mb-1.5"
              >
                New Password (minimum 8 characters)
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123D70]"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-[#123D70] mb-1.5"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123D70]"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#123D70] hover:bg-[#0e2f57] text-white font-medium py-3 px-4 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isPending ? "Updating Password..." : "Update Password & Proceed"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

