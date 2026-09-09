'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { ScrapeStatusBadge } from '@/components/scrapes/scrape-status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, RotateCw, Ban, Loader2 } from 'lucide-react';

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
  const router = useRouter();
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [rerunningId, setRerunningId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const data = await apiClient<{ data: ScrapeJob[] }>('/api/scrapes');
        setJobs(data.data);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  async function handleRerun(jobId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setRerunningId(jobId);
    try {
      const newJob = await apiClient<{ id: string }>(
        `/api/scrapes/${jobId}/rerun`,
        { method: 'POST' },
      );
      toast.success('Hunt re-running');
      router.push(`/hunts/${newJob.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to re-run');
      setRerunningId(null);
    }
  }

  async function handleCancel(jobId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCancellingId(jobId);
    try {
      await apiClient(`/api/scrapes/${jobId}/cancel`, { method: 'POST' });
      toast.success('Hunt cancelled');
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'cancelled' } : j)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel hunt');
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hunts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure and run hunting jobs
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/hunts/new" />}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Hunt
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No hunts yet. Create your first one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Sources</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Results</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="w-[44px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const canRerun =
                    job.status === 'completed' ||
                    job.status === 'failed' ||
                    job.status === 'cancelled';
                  const isRunning = job.status === 'running' || job.status === 'pending';
                  const isRerunning = rerunningId === job.id;
                  const isCancelling = cancellingId === job.id;
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Link
                          href={`/hunts/${job.id}`}
                          className="text-sm font-medium text-primary hover:text-primary/80"
                        >
                          {job.name}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {job.sources.map((source) => (
                            <Badge key={source} variant="secondary" className="capitalize text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ScrapeStatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {job.result_count}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {isRunning && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleCancel(job.id, e)}
                            disabled={isCancelling}
                            title="Cancel hunt"
                          >
                            {isCancelling ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        {canRerun && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => handleRerun(job.id, e)}
                            disabled={isRerunning}
                            title="Run again"
                          >
                            <RotateCw className={`h-3.5 w-3.5 ${isRerunning ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
