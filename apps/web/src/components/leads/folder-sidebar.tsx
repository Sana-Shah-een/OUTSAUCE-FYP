'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Folder {
  id: string;
  name: string;
  color: string;
}

export function FolderSidebar({
  folders,
  selectedFolderId,
  onSelect,
  onFoldersChange,
}: {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onFoldersChange: () => void;
}) {
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      await apiClient('/api/leads/folders', {
        method: 'POST',
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      setNewFolderName('');
      onFoldersChange();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Folders</h3>
      <button
        onClick={() => onSelect(null)}
        className={`w-full rounded-md px-3 py-1.5 text-left text-sm ${
          selectedFolderId === null
            ? 'bg-indigo-50 font-medium text-indigo-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        All Leads
      </button>
      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onSelect(folder.id)}
          className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm ${
            selectedFolderId === folder.id
              ? 'bg-indigo-50 font-medium text-indigo-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: folder.color }}
          />
          {folder.name}
        </button>
      ))}
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New folder..."
          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          +
        </button>
      </form>
    </div>
  );
}
