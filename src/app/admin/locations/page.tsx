import { db } from "@/server/db";
import { locations } from "@/db/schema";
import { LocationsClient } from "./client";

export default async function AdminLocationsPage() {
  const locationList = await db
    .select({
      id: locations.id,
      name: locations.name,
      pincode: locations.pincode,
      isActive: locations.isActive,
      createdAt: locations.createdAt,
    })
    .from(locations)
    .orderBy(locations.name);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-[#123D70]">Central Location Master</h1>
        <p className="text-sm text-gray-600 mt-1">
          Maintain standard locality and pincode options for membership applications and donor records (FRS §5.2).
        </p>
      </div>

      <LocationsClient locationList={locationList} />
    </div>
  );
}

