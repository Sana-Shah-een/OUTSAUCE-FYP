'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
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
import { ArrowLeft, Trash2 } from 'lucide-react';
import { LeadCard, type LeadCardData } from '@/components/leads/lead-card';

type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'closed' | 'archived';

interface Lead extends LeadCardData {
  status: LeadStatus;
  notes: string | null;
  updated_at: string;
}

const STATUS_COLORS: Record<LeadStatus, string> = {
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
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchLead() {
      try {
        const data = await apiClient<Lead>(`/api/leads/${leadId}`);
        setLead(data);
        setNotes(data.notes || '');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load lead');
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
      toast.success('Status updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      const data = await apiClient<Lead>(`/api/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
      setLead(data);
      toast.success('Notes saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this lead permanently?')) return;
    setDeleting(true);
    try {
      await apiClient(`/api/leads/${leadId}`, { method: 'DELETE' });
      router.push('/leads');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
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
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/leads" />}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to leads
      </Button>

      <Card>
        <CardContent className="pt-6">
          <LeadCard
            lead={lead}
            headerExtra={
              <Select
                value={lead.status}
                onValueChange={(v) => v && handleStatusChange(v as LeadStatus)}
              >
                <SelectTrigger className="w-auto border-0 p-0 h-auto">
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
            }
            footer={
              <div className="space-y-6">
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes
                  </h3>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Add your notes..."
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </Button>
                </section>

                <div className="border-t pt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    {deleting ? 'Deleting...' : 'Delete this lead'}
                  </Button>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
