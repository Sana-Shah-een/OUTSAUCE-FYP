'use client';

import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'closed' | 'archived';

interface Lead {
  id: string;
  title: string;
  company: string | null;
  source: string | null;
  location: string | null;
  salary_range: string | null;
  status: LeadStatus;
  source_url: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  contacted: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  in_progress: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  closed: 'bg-green-100 text-green-800 hover:bg-green-100',
  archived: 'bg-muted text-muted-foreground hover:bg-muted',
};

const SOURCE_LABEL: Record<string, string> = {
  linkedin: 'LinkedIn',
  upwork: 'Upwork',
  fiverr: 'Fiverr',
  reddit: 'Reddit',
};

const SOURCE_ACCENT: Record<string, string> = {
  linkedin: 'bg-[#0A66C2]/10 text-[#0A66C2] ring-[#0A66C2]/20',
  upwork: 'bg-[#14A800]/10 text-[#14A800] ring-[#14A800]/20',
  fiverr: 'bg-[#1DBF73]/10 text-[#1DBF73] ring-[#1DBF73]/20',
  reddit: 'bg-[#FF4500]/10 text-[#FF4500] ring-[#FF4500]/20',
};

function cleanTitle(raw: string): string {
  return raw
    .replace(/^\s*\[\s*HIRING\s*\]\s*/i, '')
    .replace(/^\s*HIRING:\s*/i, '')
    .trim();
}

export function LeadTable({
  leads,
  onLeadsChange,
}: {
  leads: Lead[];
  onLeadsChange: () => void;
}) {
  async function handleStatusChange(leadId: string, status: LeadStatus) {
    try {
      await apiClient(`/api/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      onLeadsChange();
    } catch {
    }
  }

  async function handleDelete(leadId: string) {
    try {
      await apiClient(`/api/leads/${leadId}`, { method: 'DELETE' });
      onLeadsChange();
    } catch {
    }
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No leads found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="!p-0">
      <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
          <TableRow>
            <TableHead className="pl-6 min-w-[200px]">Title</TableHead>
            <TableHead className="hidden md:table-cell">Company</TableHead>
            <TableHead className="hidden sm:table-cell">Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Saved</TableHead>
            <TableHead className="w-[90px] pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const sourceKey = (lead.source ?? '').toLowerCase();
              const sourceAccent =
                SOURCE_ACCENT[sourceKey] ??
                'bg-muted text-muted-foreground ring-border';
              const isVerified = lead.metadata?.verified === true;
              return (
                <TableRow key={lead.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-start gap-2">
                      {isVerified && (
                        <CheckCircle2
                          className="h-4 w-4 flex-shrink-0 text-emerald-500 mt-0.5"
                          aria-label="Verified live listing"
                        />
                      )}
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-sm font-medium text-foreground hover:text-brand-red transition-colors line-clamp-2"
                      >
                        {cleanTitle(lead.title)}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                    {lead.company || '—'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {lead.source && (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                          sourceAccent,
                        )}
                      >
                        {SOURCE_LABEL[sourceKey] ?? lead.source}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(value) =>
                        value && handleStatusChange(lead.id, value as LeadStatus)
                      }
                    >
                      <SelectTrigger className="h-7 w-auto border-0 p-0">
                        <Badge className={STATUS_COLORS[lead.status]}>
                          <SelectValue />
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {lead.source_url && (
                        <Button
                          nativeButton={false}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          render={
                            <a
                              href={lead.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open original"
                            />
                          }
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(lead.id)}
                        title="Delete lead"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
        </Table>
      </div>
    </Card>
  );
}
