import { getCurrentUser } from "@/server/auth/authorisation";
import { redirect } from "next/navigation";
import { StaffSelfServiceClient } from "./client";

export default async function StaffSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?from=/settings");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="pb-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#123D70]">Account Settings</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your personal counter staff profile and login password (FRS §3.2).
            </p>
          </div>
        </div>

        <StaffSelfServiceClient user={user} />
      </div>
    </div>
  );
}

