export default function ScrapesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scrapes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure and run scraping jobs
          </p>
        </div>
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Scrape
        </button>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">No scrape jobs yet. Create your first one to get started.</p>
      </div>
    </div>
  );
}
