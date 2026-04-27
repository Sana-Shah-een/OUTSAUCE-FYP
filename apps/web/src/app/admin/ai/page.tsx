'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Cpu, Zap } from 'lucide-react';

interface AiData {
  totalGenerations: number;
  byTool: Record<string, number>;
}

export default function AdminAiPage() {
  const [data, setData] = useState<AiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAi() {
      try {
        const response = await apiClient<AiData>('/api/admin/ai');
        setData(response);
      } catch (error) {
        console.error('Failed to fetch AI usage:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAi();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-main">AI Usage & Costs</h1>
        <p className="text-text-muted mt-2">
          Monitor Anthropic Claude API generations and tool popularity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border-black/5 dark:border-white/5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-text-muted">Total AI Generations</CardTitle>
            <Cpu className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-4xl font-bold text-text-main">{data?.totalGenerations || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <h2 className="text-xl font-semibold text-text-main mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-red" /> Popular Tools
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))
          ) : !data || Object.keys(data.byTool).length === 0 ? (
            <div className="col-span-3 text-text-muted">No AI generations found.</div>
          ) : (
            Object.entries(data.byTool).map(([tool, count]) => (
              <div key={tool} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl p-6 shadow-lg transition-transform hover:scale-105">
                <h3 className="text-text-muted capitalize mb-2 font-medium">{tool.replace('_', ' ')}</h3>
                <div className="text-3xl font-bold text-text-main">{count}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
