'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

export function ScrapeResultsTable({ results }: { results: ScrapeResult[] }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  async function handleSaveLead(resultId: string) {
    setSavingIds((prev) => new Set(prev).add(resultId));
    try {
      await apiClient('/api/leads', {
        method: 'POST',
        body: JSON.stringify({ scrape_result_id: resultId }),
      });
      setSavedIds((prev) => new Set(prev).add(resultId));
    } catch {
      // ignore
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

    try {
      await apiClient('/api/leads/bulk', {
        method: 'POST',
        body: JSON.stringify({ scrape_result_ids: unsavedIds }),
      });
      setSavedIds(new Set(results.map((r) => r.id)));
    } catch {
      // ignore
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

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={handleBulkSave}>
          Save All as Leads
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
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {result.source_url ? (
                        <a
                          href={result.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          {result.title}
                        </a>
                      ) : (
                        result.title
                      )}
                    </div>
                    {result.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {result.company || '-'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className="capitalize">
                      {result.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {result.location || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {result.salary_range || '-'}
                  </TableCell>
                  <TableCell>
                    {savedIds.has(result.id) ? (
                      <span className="text-xs font-medium text-green-600">
                        Saved
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveLead(result.id)}
                        disabled={savingIds.has(result.id)}
                        className="h-7 text-xs"
                      >
                        {savingIds.has(result.id) ? 'Saving...' : 'Save Lead'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
