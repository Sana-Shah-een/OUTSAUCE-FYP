'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LeadCard, type LeadCardData } from '@/components/leads/lead-card';
import { FitBadge } from '@/components/leads/fit-badge';
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrapeResult {
  id: string;
  source: string;
  source_url: string | null;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  salary_range: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  fit_score?: number | null;
  fit_reasoning?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export function ScrapeResultsTable({ results }: { results: ScrapeResult[] }) {
  const router = useRouter();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = results.find((r) => r.id === selectedId) ?? null;

  async function handleSaveLead(resultId: string) {
    setSavingIds((prev) => new Set(prev).add(resultId));
    try {
      await apiClient('/api/leads', {
        method: 'POST',
        body: JSON.stringify({ scrape_result_id: resultId }),
      });
      setSavedIds((prev) => new Set(prev).add(resultId));
      toast.success('Saved to leads');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save lead');
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(resultId);
        return next;
      });
    }
  }

  async function handleBulkSave() {
    const unsavedIds = results
      .filter((r) => !savedIds.has(r.id))
      .map((r) => r.id);
    if (unsavedIds.length === 0) return;

    setBulkSaving(true);
    try {
      await apiClient('/api/leads/bulk', {
        method: 'POST',
        body: JSON.stringify({ scrape_result_ids: unsavedIds }),
      });
      setSavedIds(new Set(results.map((r) => r.id)));
      toast.success(`Saved ${unsavedIds.length} lead${unsavedIds.length !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to bulk save');
    } finally {
      setBulkSaving(false);
    }
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No results yet.</p>
        </CardContent>
      </Card>
    );
  }

  const allSaved = results.every((r) => savedIds.has(r.id));

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={handleBulkSave} disabled={bulkSaving || allSaved}>
          {bulkSaving ? 'Saving...' : allSaved ? 'All saved' : 'Save All as Leads'}
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell w-[160px]">Company</TableHead>
                <TableHead className="hidden sm:table-cell w-[110px]">Source</TableHead>
                <TableHead className="w-[95px]">Match</TableHead>
                <TableHead className="hidden lg:table-cell w-[140px]">Location</TableHead>
                <TableHead className="hidden lg:table-cell w-[120px]">Salary</TableHead>
                <TableHead className="w-[44px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => {
                const isSaved = savedIds.has(result.id);
                const isVerified = result.metadata?.verified === true;
                return (
                  <TableRow
                    key={result.id}
                    onClick={() => setSelectedId(result.id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="whitespace-normal">
                      <div className="flex items-center gap-2 min-w-0">
                        {isSaved && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate min-w-0">
                              {result.title}
                            </span>
                            {isVerified && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400 flex-shrink-0"
                                title="Verified live listing"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Verified
                              </span>
                            )}
                          </div>
                          {result.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate">
                      {result.company || '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="capitalize">
                        {result.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <FitBadge score={result.fit_score} reasoning={result.fit_reasoning} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate">
                      {result.location || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate">
                      {result.salary_range || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground inline-block" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Sheet
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent
          side="right"
          className={cn(
            'w-full overflow-y-auto p-6 pr-12',
            'data-[side=right]:sm:max-w-xl data-[side=right]:lg:max-w-2xl data-[side=right]:xl:max-w-3xl',
          )}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{selected?.title ?? 'Result details'}</SheetTitle>
          </SheetHeader>
          {selected && (
            <LeadCard
              lead={selected as LeadCardData}
              footer={
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const desc = `${selected.title}${selected.company ? ` (${selected.company})` : ''}\n\n${selected.description || ''}`;
                      const params = new URLSearchParams({ jobDesc: desc.trim() });
                      router.push(`/ai-tools?${params.toString()}`);
                    }}
                    className="gap-1"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-brand-red" />
                    Tailor AI Content
                  </Button>
                  {savedIds.has(selected.id) ? (
                    <Button disabled variant="outline">
                      <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-500" />
                      Saved as lead
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSaveLead(selected.id)}
                      disabled={savingIds.has(selected.id)}
                    >
                      {savingIds.has(selected.id) ? 'Saving...' : 'Save as lead'}
                    </Button>
                  )}
                </div>
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
