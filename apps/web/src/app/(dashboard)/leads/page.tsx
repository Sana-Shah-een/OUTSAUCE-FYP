'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { LeadTable } from '@/components/leads/lead-table';
import { FolderSidebar } from '@/components/leads/folder-sidebar';
import { TagManager } from '@/components/leads/tag-manager';

interface Lead {
  id: string;
  title: string;
  company: string | null;
  source: string | null;
  location: string | null;
  salary_range: string | null;
  status: 'new' | 'contacted' | 'in_progress' | 'closed' | 'archived';
  source_url: string | null;
  created_at: string;
}

interface Folder {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (selectedFolderId) params.set('folder_id', selectedFolderId);
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiClient<{ data: Lead[] }>(
        `/api/leads?${params.toString()}`,
      );
      setLeads(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedFolderId, statusFilter]);

  const fetchFolders = useCallback(async () => {
    try {
      const data = await apiClient<Folder[]>('/api/leads/folders');
      setFolders(data);
    } catch {
      // ignore
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const data = await apiClient<Tag[]>('/api/leads/tags');
      setTags(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchFolders();
    fetchTags();
  }, [fetchLeads, fetchFolders, fetchTags]);

  async function handleExport(format: 'csv' | 'json') {
    if (leads.length === 0) return;
    setExporting(true);
    try {
      const leadIds = leads.map((l) => l.id);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/export/leads`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_ids: leadIds, format }),
        },
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 space-y-6">
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelect={setSelectedFolderId}
          onFoldersChange={fetchFolders}
        />
        <TagManager tags={tags} onTagsChange={fetchTags} />
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="mt-1 text-sm text-gray-600">
              {leads.length} lead{leads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>

            {/* Export */}
            <div className="relative">
              <button
                disabled={exporting || leads.length === 0}
                onClick={() => handleExport('csv')}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
            <button
              disabled={exporting || leads.length === 0}
              onClick={() => handleExport('json')}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Export JSON
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <LeadTable leads={leads} onLeadsChange={fetchLeads} />
        )}
      </div>
    </div>
  );
}
