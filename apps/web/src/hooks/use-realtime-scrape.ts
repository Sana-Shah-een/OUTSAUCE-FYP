'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ScrapeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface ScrapeJobUpdate {
  id: string;
  status: ScrapeStatus;
  result_count: number;
  error_message: string | null;
  completed_at: string | null;
}

export function useRealtimeScrape(jobId: string | null) {
  const [status, setStatus] = useState<ScrapeStatus | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`scrape-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scrape_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const updated = payload.new as ScrapeJobUpdate;
          setStatus(updated.status);
          setResultCount(updated.result_count);
          setErrorMessage(updated.error_message);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { status, resultCount, errorMessage };
}
