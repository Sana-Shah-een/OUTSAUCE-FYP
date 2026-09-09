'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { LeadTable } from '@/components/leads/lead-table';
import { TagManager } from '@/components/leads/tag-manager';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tags, Download } from 'lucide-react';

interface Lead {
  id: string;
  title: string;
  company: string | null;
  source: string | null;
  location: string | null;
  salary_range: string | null;
  status: 'new' | 'contacted' | 'in_progress' | 'closed' | 'archived';
  source_url: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (tagFilter && tagFilter !== 'all') params.set('tag_id', tagFilter);
      const data = await apiClient<{ data: Lead[] }>(
        `/api/leads?${params.toString()}`,
      );
      setLeads(data.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tagFilter]);

  const fetchTags = useCallback(async () => {
    try {
      const data = await apiClient<Tag[]>('/api/leads/tags');
      setTags(data);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchTags();
  }, [fetchLeads, fetchTags]);

  async function handleExport(format: 'csv' | 'json') {
    if (leads.length === 0) return;
    setExporting(true);
    try {
      const leadIds = leads.map((l) => l.id);
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/export/leads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
          body: JSON.stringify({ lead_ids: leadIds, format }),
        },
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="hidden md:block w-56 flex-shrink-0 space-y-6">
        <TagManager tags={tags} onTagsChange={fetchTags} />
      </div>

      <div className="flex-1 space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {leads.length} lead{leads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="md:hidden">
                    <Tags className="h-4 w-4 mr-1.5" />
                    Tags
                  </Button>
                }
              />
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Tags</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <TagManager tags={tags} onTagsChange={fetchTags} />
                </div>
              </SheetContent>
            </Sheet>

            <Select value={tagFilter} onValueChange={(v) => v && setTagFilter(v)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span style={{ color: t.color }}>●</span> {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              disabled={exporting || leads.length === 0}
              onClick={() => handleExport('csv')}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {exporting ? 'Exporting...' : 'CSV'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exporting || leads.length === 0}
              onClick={() => handleExport('json')}
            >
              JSON
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <LeadTable leads={leads} allTags={tags} onLeadsChange={fetchLeads} />
        )}
      </div>
    </div>
  );
}
