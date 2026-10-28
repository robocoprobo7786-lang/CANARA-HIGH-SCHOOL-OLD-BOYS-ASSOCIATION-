"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/server/auth/actions";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const res = await loginAction(prevState, formData);
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
        {/* Header with Association Branding */}
        <div className="bg-[#123D70] p-8 text-white text-center">
          <div className="inline-block p-3 bg-white/10 rounded-full mb-3">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-white">
            Canara High School Old Boys’ Association
          </h1>
          <p className="text-xs text-[#EAF1F8]/80 font-medium tracking-wide uppercase">
            Membership & Donor Management System
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#123D70]">Staff & Admin Login</h2>
            <p className="text-sm text-gray-600 mt-1">
              Sign in with your registered 10-digit mobile number and password.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <div className="flex gap-2">
                <svg
                  className="w-5 h-5 text-red-500 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="mobile"
                className="block text-sm font-semibold text-[#123D70] mb-1.5"
              >
                Mobile Number
              </label>
              <div className="relative">
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123D70] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#123D70] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123D70] focus:border-transparent transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#123D70] hover:bg-[#0e2f57] text-white font-medium py-3 px-4 rounded-lg shadow-sm hover:shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing In...
                  </>
                ) : (
                  "Sign In to System"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-500">
            Canara High School Old Boys’ Association (R.) | Mangaluru
          </p>
        </div>
      </div>
    </div>
  );
}

