"use client";

import { useActionState, useState } from "react";
import {
  addLocationAction,
  renameLocationAction,
  toggleLocationActiveAction,
} from "@/server/admin/location-actions";

interface LocationItem {
  id: string;
  name: string;
  pincode: string | null;
  isActive: boolean;
  createdAt: Date;
}

export function LocationsClient({ locationList }: { locationList: LocationItem[] }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<LocationItem | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Add Location Action State
  const [addState, addFormAction, isAdding] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const res = await addLocationAction(prev, formData);
      if (res.success) {
        setShowAddModal(false);
        setStatusMsg(res.message);
      }
      return res;
    },
    null
  );

  // Rename Location Action State
  const [editState, editFormAction, isEditing] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const res = await renameLocationAction(prev, formData);
      if (res.success) {
        setEditTarget(null);
        setStatusMsg(res.message);
      }
      return res;
    },
    null
  );

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex justify-between items-center">
          <span>{statusMsg}</span>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <span className="text-sm font-semibold text-gray-700">
          Total Locations: {locationList.length}
        </span>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#123D70] hover:bg-[#0e2f57] text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>＋</span> Add Location
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Place / Locality Name</th>
              <th className="py-3.5 px-4">Standard Pincode</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {locationList.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No locations added yet. Click "Add Location" to create one.
                </td>
              </tr>
            ) : (
              locationList.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-semibold text-gray-900">{loc.name}</td>
                  <td className="py-3.5 px-4 text-gray-600 font-mono text-xs">
                    {loc.pincode || "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        loc.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {loc.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-3">
                    <button
                      onClick={() => setEditTarget(loc)}
                      className="text-xs font-medium text-blue-700 hover:text-blue-900 cursor-pointer"
                    >
                      Edit / Rename
                    </button>
                    <button
                      onClick={async () => {
                        const res = await toggleLocationActiveAction(loc.id, !loc.isActive);
                        if (res.success) setStatusMsg(res.message);
                      }}
                      className={`text-xs font-semibold cursor-pointer ${
                        loc.isActive
                          ? "text-red-600 hover:text-red-800"
                          : "text-emerald-600 hover:text-emerald-800"
                      }`}
                    >
                      {loc.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Location */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-[#123D70] mb-1">Add Location</h2>
            <p className="text-xs text-gray-500 mb-4">
              Enter the locality name. Names are unique case-insensitively (FRS §5.2).
            </p>

            {!addState?.success && addState?.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {addState.error}
              </div>
            )}

            <form action={addFormAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Locality Name
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Dongerkery"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Default 6-Digit Pincode (Optional)
                </label>
                <input
                  name="pincode"
                  maxLength={6}
                  placeholder="e.g. 575003"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-1.5 bg-[#123D70] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isAdding ? "Adding..." : "Add Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Location */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-[#123D70] mb-1">Edit Location</h2>
            <p className="text-xs text-gray-500 mb-4">Update place name or associated pincode.</p>

            {!editState?.success && editState?.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {editState.error}
              </div>
            )}

            <form action={editFormAction} className="space-y-4">
              <input type="hidden" name="locationId" value={editTarget.id} />
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Locality Name
                </label>
                <input
                  name="name"
                  defaultValue={editTarget.name}
                  required
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                <input
                  name="pincode"
                  defaultValue={editTarget.pincode || ""}
                  maxLength={6}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-3 py-1.5 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-1.5 bg-[#123D70] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isEditing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

