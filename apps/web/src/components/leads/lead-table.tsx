'use client';

import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

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
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-purple-100 text-purple-800',
  closed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
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
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">No leads found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Company
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Source
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Saved
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link
                  href={`/leads/${lead.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {lead.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {lead.company || '-'}
              </td>
              <td className="px-4 py-3">
                {lead.source && (
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700">
                    {lead.source}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <select
                  value={lead.status}
                  onChange={(e) =>
                    handleStatusChange(lead.id, e.target.value as LeadStatus)
                  }
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 cursor-pointer ${statusColors[lead.status]}`}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {new Date(lead.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {lead.source_url && (
                    <a
                      href={lead.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-indigo-600"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(lead.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
