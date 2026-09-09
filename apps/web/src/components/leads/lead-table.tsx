'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Trash2,
  ExternalLink,
  CheckCircle2,
  MoreVertical,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FitBadge } from './fit-badge';

type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'closed' | 'archived';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Lead {
  id: string;
  title: string;
  company: string | null;
  source: string | null;
  location: string | null;
  salary_range: string | null;
  status: LeadStatus;
  fit_score?: number | null;
  fit_reasoning?: string | null;
  source_url: string | null;
  created_at: string;
  tags?: Tag[];
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

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

export function LeadTable({
  leads,
  allTags = [],
  onLeadsChange,
}: {
  leads: Lead[];
  allTags?: Tag[];
  onLeadsChange: () => void;
}) {
  const router = useRouter();

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
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Title</TableHead>
            <TableHead className="hidden md:table-cell w-[180px]">Company</TableHead>
            <TableHead className="w-[95px]">Match</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead className="hidden lg:table-cell w-[80px]">Saved</TableHead>
            <TableHead className="w-[48px] pr-6 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const sourceKey = (lead.source ?? '').toLowerCase();
            const sourceAccent =
              SOURCE_ACCENT[sourceKey] ?? 'bg-muted text-muted-foreground ring-border';
            const isVerified = lead.metadata?.verified === true;

            return (
              <TableRow key={lead.id}>
                {/* Title */}
                <TableCell className="pl-6 min-w-0">
                  <div className="flex items-start gap-2 min-w-0">
                    {isVerified && (
                      <CheckCircle2
                        className="h-4 w-4 flex-shrink-0 text-emerald-500 mt-0.5"
                        aria-label="Verified live listing"
                      />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-sm font-medium text-foreground hover:text-brand-red transition-colors line-clamp-2"
                      >
                        {cleanTitle(lead.title)}
                      </Link>
                      {/* tags surface here as small read-only chips, editing happens on the detail page */}
                      {lead.tags && lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lead.tags.slice(0, 3).map((t) => (
                            <span
                              key={t.id}
                              className="text-[10px] px-1.5 py-0 rounded font-normal"
                              style={{
                                backgroundColor: (t.color || '#3b82f6') + '1a',
                                color: t.color || '#3b82f6',
                              }}
                            >
                              {t.name}
                            </span>
                          ))}
                          {lead.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{lead.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Company + Source merged */}
                <TableCell className="hidden md:table-cell min-w-0">
                  <div className="text-sm text-muted-foreground truncate">
                    {lead.company || '—'}
                  </div>
                  {lead.source && (
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset mt-1',
                        sourceAccent,
                      )}
                    >
                      {SOURCE_LABEL[sourceKey] ?? lead.source}
                    </span>
                  )}
                </TableCell>

                {/* Match */}
                <TableCell>
                  <FitBadge score={lead.fit_score} reasoning={lead.fit_reasoning} />
                </TableCell>

                {/* Status */}
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

                {/* Saved */}
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                  {timeAgo(lead.created_at)}
                </TableCell>

                {/* Actions: single dropdown menu instead of three separate controls */}
                <TableCell className="pr-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      nativeButton={true}
                      render={
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open actions</span>
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => router.push(`/ai-tools?leadId=${lead.id}`)}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-2 text-brand-red" />
                        Tailor AI content
                      </DropdownMenuItem>
                      {lead.source_url && (
                        <DropdownMenuItem
                          render={
                            <a
                              href={lead.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          Open original
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(lead.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete lead
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
