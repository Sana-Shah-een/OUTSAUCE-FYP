'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';

type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'closed' | 'archived';

interface Lead {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  source: string | null;
  source_url: string | null;
  location: string | null;
  salary_range: string | null;
  status: LeadStatus;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  contacted: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  in_progress: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  closed: 'bg-green-100 text-green-800 hover:bg-green-100',
  archived: 'bg-muted text-muted-foreground hover:bg-muted',
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchLead() {
      try {
        const data = await apiClient<Lead>(`/api/leads/${leadId}`);
        setLead(data);
        setNotes(data.notes || '');
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchLead();
  }, [leadId]);

  async function handleStatusChange(status: LeadStatus) {
    try {
      const data = await apiClient<Lead>(`/api/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setLead(data);
    } catch {
      // ignore
    }
  }

  async function handleSaveNotes() {
    setSaving(true);
    try {
      const data = await apiClient<Lead>(`/api/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
      setLead(data);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await apiClient(`/api/leads/${leadId}`, { method: 'DELETE' });
      router.push('/leads');
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Lead not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/leads" />}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to leads
      </Button>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">{lead.title}</h1>
              {lead.company && (
                <p className="mt-1 text-sm text-muted-foreground">{lead.company}</p>
              )}
            </div>
            <Select value={lead.status} onValueChange={(v) => v && handleStatusChange(v as LeadStatus)}>
              <SelectTrigger className="w-auto border-0 p-0 h-auto">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Source:</span>{' '}
              <span className="capitalize font-medium">{lead.source || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>{' '}
              <span className="font-medium">{lead.location || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Salary:</span>{' '}
              <span className="font-medium">{lead.salary_range || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Saved:</span>{' '}
              <span className="font-medium">
                {new Date(lead.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {lead.source_url && (
            <Button variant="link" className="p-0 h-auto" render={<a href={lead.source_url} target="_blank" rel="noopener noreferrer" />}>
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              View original listing
            </Button>
          )}

          {lead.description && (
            <div>
              <h3 className="text-sm font-medium text-foreground">Description</h3>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                {lead.description}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Notes</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add your notes..."
            />
            <Button size="sm" onClick={handleSaveNotes} disabled={saving}>
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>

          <div className="border-t pt-4">
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete this lead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
