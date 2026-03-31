'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Plus } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Scrapes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure and run scraping jobs
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/scrapes/new" />}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Scrape
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
              No scrape jobs yet. Create your first one to get started.
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link
                        href={`/scrapes/${job.id}`}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
