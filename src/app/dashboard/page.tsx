export default function StaffDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-[#123D70]">Staff Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">
          Welcome to the CHSOBA Counter Management System.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-12 text-center text-gray-500">
        <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-700">Operational Dashboard</p>
        <p className="text-xs text-gray-500 mt-1">
          Counter operational metrics and quick application shortcuts will appear here.
        </p>
      </div>
    </div>
  );
}

