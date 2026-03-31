'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { ScrapeStatusBadge } from '@/components/scrapes/scrape-status-badge';

type ScrapeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface ScrapeJob {
  id: string;
  name: string;
  sources: string[];
  status: ScrapeStatus;
  result_count: number;
  created_at: string;
}

export default function ScrapesPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const data = await apiClient<{ data: ScrapeJob[] }>('/api/scrapes');
        setJobs(data.data);
      } catch {
        // Handle error silently for now
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scrapes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure and run scraping jobs
          </p>
        </div>
        <Link
          href="/scrapes/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New Scrape
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">
            No scrape jobs yet. Create your first one to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sources
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Results
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/scrapes/${job.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {job.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {job.sources.map((source) => (
                        <span
                          key={source}
                          className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ScrapeStatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {job.result_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
