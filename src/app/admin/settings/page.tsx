import { db } from "@/server/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SettingsFormClient } from "./client";

export default async function AdminSettingsPage() {
  const [currentSettings] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-[#123D70]">Association Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Configure branding, official contact details, receipt signatory, and membership fees (FRS §5.5, §8.2).
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800">
        <strong>Important (FRS §5.5):</strong> Changing the membership fee updates the default for new applications. It does NOT retroactively affect previously approved applications.
      </div>

      <SettingsFormClient initialSettings={currentSettings} />
    </div>
  );
}

