'use client';

import { useState } from 'react';
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
import { CheckCircle2, ChevronRight } from 'lucide-react';
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
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export function ScrapeResultsTable({ results }: { results: ScrapeResult[] }) {
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden sm:table-cell">Source</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden lg:table-cell">Salary</TableHead>
                <TableHead className="w-[44px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => {
                const isSaved = savedIds.has(result.id);
                return (
                  <TableRow
                    key={result.id}
                    onClick={() => setSelectedId(result.id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isSaved && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {result.title}
                          </div>
                          {result.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {result.company || '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="capitalize">
                        {result.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {result.location || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
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
                <div className="flex justify-end">
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
