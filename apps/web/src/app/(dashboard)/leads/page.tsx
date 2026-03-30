export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your saved leads
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">No leads saved yet. Run a scrape and save results as leads.</p>
      </div>
    </div>
  );
}
