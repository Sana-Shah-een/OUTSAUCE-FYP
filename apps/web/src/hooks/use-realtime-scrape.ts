'use client';

import { useEffect, useState } from 'react';
import { createRealtimeAuthedClient } from '@/lib/supabase/realtime';

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

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const { supabase, unsubscribeAuth } = await createRealtimeAuthedClient();
      if (cancelled) {
        unsubscribeAuth();
        return;
      }

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
          (payload: any) => {
            const updated = payload.new as ScrapeJobUpdate;
            setStatus(updated.status);
            setResultCount(updated.result_count);
            setErrorMessage(updated.error_message);
          },
        )
        .subscribe();

      cleanup = () => {
        supabase.removeChannel(channel);
        unsubscribeAuth();
      };
    })();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [jobId]);

  return { status, resultCount, errorMessage };
}
