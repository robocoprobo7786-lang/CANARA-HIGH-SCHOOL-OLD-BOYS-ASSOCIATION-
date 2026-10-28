export default function AdminDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-[#123D70]">Super Admin Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">
          Canara High School Old Boys’ Association — Overview & System Metrics
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-12 text-center text-gray-500">
        <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-700">Administrative Overview</p>
        <p className="text-xs text-gray-500 mt-1">
          Membership totals, financial collections, and approval queues will appear here.
        </p>
      </div>
    </div>
  );
}

