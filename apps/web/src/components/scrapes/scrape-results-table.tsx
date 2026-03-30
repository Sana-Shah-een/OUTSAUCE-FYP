'use client';

interface ScrapeResult {
  id: string;
  source: string;
  source_url: string | null;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  salary_range: string | null;
}

export function ScrapeResultsTable({ results }: { results: ScrapeResult[] }) {
  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">No results yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Company
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Source
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Location
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Salary
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {results.map((result) => (
            <tr key={result.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900">
                  {result.source_url ? (
                    <a
                      href={result.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      {result.title}
                    </a>
                  ) : (
                    result.title
                  )}
                </div>
                {result.description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {result.description}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {result.company || '-'}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700">
                  {result.source}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {result.location || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {result.salary_range || '-'}
              </td>
              <td className="px-4 py-3">
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Save Lead
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
