'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Tag {
  id: string;
  name: string;
  color: string;
}

export function TagManager({
  tags,
  onTagsChange,
}: {
  tags: Tag[];
  onTagsChange: () => void;
}) {
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setCreating(true);
    try {
      await apiClient('/api/leads/tags', {
        method: 'POST',
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      setNewTagName('');
      onTagsChange();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(tagId: string) {
    try {
      await apiClient(`/api/leads/tags/${tagId}`, { method: 'DELETE' });
      onTagsChange();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Tags</h3>
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag..."
          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: tag.color + '20', color: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => handleDelete(tag.id)}
              className="ml-0.5 hover:opacity-70"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
