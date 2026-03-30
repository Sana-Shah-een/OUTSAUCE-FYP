'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useRealtimeScrape } from '@/hooks/use-realtime-scrape';
import { ScrapeStatusBadge } from '@/components/scrapes/scrape-status-badge';
import { ScrapeResultsTable } from '@/components/scrapes/scrape-results-table';

type ScrapeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface ScrapeJob {
  id: string;
  name: string;
  sources: string[];
  criteria: Record<string, unknown>;
  status: ScrapeStatus;
  result_count: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

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

export default function ScrapeDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<ScrapeJob | null>(null);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { status: realtimeStatus, resultCount } = useRealtimeScrape(jobId);

  const fetchResults = useCallback(async () => {
    try {
      const data = await apiClient<{ data: ScrapeResult[] }>(
        `/api/scrapes/${jobId}/results?limit=100`,
      );
      setResults(data.data);
    } catch {
      // Results may not be available yet
    }
  }, [jobId]);

  useEffect(() => {
    async function fetchJob() {
      try {
        const data = await apiClient<ScrapeJob>(`/api/scrapes/${jobId}`);
        setJob(data);
        if (data.status === 'completed') {
          await fetchResults();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scrape');
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [jobId, fetchResults]);

  // When realtime status changes to completed, fetch results
  useEffect(() => {
    if (realtimeStatus === 'completed') {
      setJob((prev) =>
        prev ? { ...prev, status: 'completed', result_count: resultCount } : prev,
      );
      fetchResults();
    } else if (realtimeStatus === 'failed') {
      setJob((prev) => (prev ? { ...prev, status: 'failed' } : prev));
    } else if (realtimeStatus) {
      setJob((prev) => (prev ? { ...prev, status: realtimeStatus } : prev));
    }
  }, [realtimeStatus, resultCount, fetchResults]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">{error || 'Scrape job not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/scrapes"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to scrapes
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{job.name}</h1>
          <ScrapeStatusBadge status={job.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {job.sources.map((source) => (
            <span
              key={source}
              className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700"
            >
              {source}
            </span>
          ))}
        </div>
      </div>

      {/* Job info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Results</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {job.result_count}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Started</p>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {job.started_at
              ? new Date(job.started_at).toLocaleString()
              : 'Not started'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {job.completed_at
              ? new Date(job.completed_at).toLocaleString()
              : '-'}
          </p>
        </div>
      </div>

      {/* Criteria */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-medium text-gray-700">Search Criteria</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {(job.criteria as { keywords?: string[] }).keywords?.map(
            (kw: string) => (
              <span
                key={kw}
                className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
              >
                {kw}
              </span>
            ),
          )}
          {(job.criteria as { location?: string }).location && (
            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
              {(job.criteria as { location: string }).location}
            </span>
          )}
          {(job.criteria as { remote?: boolean }).remote && (
            <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-700">
              Remote
            </span>
          )}
        </div>
      </div>

      {/* Error message */}
      {job.error_message && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{job.error_message}</p>
        </div>
      )}

      {/* Running indicator */}
      {(job.status === 'pending' || job.status === 'running') && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-blue-700">
            {job.status === 'pending'
              ? 'Waiting to start...'
              : 'Scraping in progress... Results will appear automatically.'}
          </p>
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Results ({results.length})
          </h2>
          <ScrapeResultsTable results={results} />
        </div>
      )}
    </div>
  );
}
