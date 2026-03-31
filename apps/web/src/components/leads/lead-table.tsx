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
import { Trash2, ExternalLink } from 'lucide-react';

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
}

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  contacted: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  in_progress: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  closed: 'bg-green-100 text-green-800 hover:bg-green-100',
  archived: 'bg-muted text-muted-foreground hover:bg-muted',
};

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
      // ignore
    }
  }

  async function handleDelete(leadId: string) {
    try {
      await apiClient(`/api/leads/${leadId}`, { method: 'DELETE' });
      onLeadsChange();
    } catch {
      // ignore
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
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden sm:table-cell">Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Saved</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    {lead.title}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {lead.company || '-'}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {lead.source && (
                    <Badge variant="secondary" className="capitalize">
                      {lead.source}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={lead.status}
                    onValueChange={(value) => value && handleStatusChange(lead.id, value as LeadStatus)}
                  >
                    <SelectTrigger className="h-7 w-auto border-0 p-0">
                      <Badge className={statusColors[lead.status]}>
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
                <TableCell>
                  <div className="flex items-center gap-1">
                    {lead.source_url && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" render={<a href={lead.source_url} target="_blank" rel="noopener noreferrer" />}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(lead.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
