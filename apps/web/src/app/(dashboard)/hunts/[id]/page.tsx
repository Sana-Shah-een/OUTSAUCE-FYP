'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useRealtimeScrape } from '@/hooks/use-realtime-scrape';
import { ScrapeStatusBadge } from '@/components/scrapes/scrape-status-badge';
import { ScrapeResultsTable } from '@/components/scrapes/scrape-results-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Ban, Loader2, RotateCw } from 'lucide-react';

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
  fit_score?: number | null;
  fit_reasoning?: string | null;
}

export default function ScrapeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<ScrapeJob | null>(null);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { status: realtimeStatus, resultCount } = useRealtimeScrape(jobId);

  async function handleRerun() {
    setRerunning(true);
    try {
      const newJob = await apiClient<{ id: string }>(
        `/api/scrapes/${jobId}/rerun`,
        { method: 'POST' },
      );
      toast.success('Hunt re-running');
      router.push(`/hunts/${newJob.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to re-run');
      setRerunning(false);
    }
  }

  async function handleCancel() {
    if (!job) return;
    setCancelling(true);
    try {
      await apiClient(`/api/scrapes/${job.id}/cancel`, { method: 'POST' });
      toast.success('Hunt cancelled');
      setJob((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel hunt');
    } finally {
      setCancelling(false);
    }
  }

  const fetchResults = useCallback(async () => {
    try {
      const data = await apiClient<{ data: ScrapeResult[] }>(
        `/api/scrapes/${jobId}/results?limit=100`,
      );
      setResults(data.data);
    } catch {
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
        setError(err instanceof Error ? err.message : 'Failed to load hunt');
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [jobId, fetchResults]);

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

  // Poll for scoring completion while any lead has fit_score: null
  useEffect(() => {
    if (job?.status !== 'completed' || results.length === 0) return;

    const hasUnscoredLeads = results.some(
      (r) => r.fit_score === null || r.fit_score === undefined,
    );
    if (!hasUnscoredLeads) return;

    const interval = setInterval(() => {
      fetchResults();
    }, 5000);

    return () => clearInterval(interval);
  }, [job?.status, results, fetchResults]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Hunt not found'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2" nativeButton={false} render={<Link href="/hunts" />}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to hunts
        </Button>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-2xl font-bold text-foreground break-words">{job.name}</h1>
            <ScrapeStatusBadge status={job.status} />
          </div>
          {(job.status === 'pending' || job.status === 'running') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            >
              {cancelling ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Ban className="h-3.5 w-3.5 mr-1.5" />
              )}
              {cancelling ? 'Cancelling...' : 'Cancel Hunt'}
            </Button>
          )}
          {(job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRerun}
              disabled={rerunning}
              className="flex-shrink-0"
            >
              <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${rerunning ? 'animate-spin' : ''}`} />
              {rerunning ? 'Re-running...' : 'Run again'}
            </Button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {job.sources.map((source) => (
            <Badge key={source} variant="secondary" className="capitalize">
              {source}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Results</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{job.result_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Started</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {job.started_at ? new Date(job.started_at).toLocaleString() : 'Not started'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {job.completed_at ? new Date(job.completed_at).toLocaleString() : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-foreground">Search Criteria</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(job.criteria as { keywords?: string[] }).keywords?.map((kw: string) => (
              <Badge key={kw} className="bg-primary/10 text-primary hover:bg-primary/10">
                {kw}
              </Badge>
            ))}
            {(job.criteria as { location?: string }).location && (
              <Badge variant="secondary">
                {(job.criteria as { location: string }).location}
              </Badge>
            )}
            {(job.criteria as { remote?: boolean }).remote && (
              <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50">
                Remote
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {job.error_message && (
        <Alert variant="destructive">
          <AlertDescription>{job.error_message}</AlertDescription>
        </Alert>
      )}

      {(job.status === 'pending' || job.status === 'running') && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            {job.status === 'pending'
              ? 'Waiting to start...'
              : 'Hunt in progress... Results will appear automatically.'}
          </AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Results ({results.length})
          </h2>
          <ScrapeResultsTable results={results} />
        </div>
      )}
    </div>
  );
}
