'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

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
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-purple-100 text-purple-800',
  closed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
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
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">Lead not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/leads"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to leads
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{lead.title}</h1>
            {lead.company && (
              <p className="mt-1 text-sm text-gray-600">{lead.company}</p>
            )}
          </div>
          <select
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
            className={`rounded-full px-3 py-1 text-sm font-medium border-0 cursor-pointer ${statusColors[lead.status]}`}
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Source:</span>{' '}
            <span className="capitalize font-medium">{lead.source || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Location:</span>{' '}
            <span className="font-medium">{lead.location || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Salary:</span>{' '}
            <span className="font-medium">{lead.salary_range || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Saved:</span>{' '}
            <span className="font-medium">
              {new Date(lead.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {lead.source_url && (
          <a
            href={lead.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm text-indigo-600 hover:text-indigo-500"
          >
            View original listing &rarr;
          </a>
        )}

        {lead.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-700">Description</h3>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
              {lead.description}
            </p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-700">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Add your notes..."
          />
          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="mt-2 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={handleDelete}
            className="text-sm text-red-600 hover:text-red-500"
          >
            Delete this lead
          </button>
        </div>
      </div>
    </div>
  );
}
