'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

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
      <h3 className="text-sm font-medium text-foreground">Tags</h3>
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag..."
          className="h-8 text-sm"
        />
        <Button type="submit" size="sm" disabled={creating} className="h-8">
          Add
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1"
            style={{ backgroundColor: tag.color + '20', color: tag.color }}
          >
            {tag.name}
            <button onClick={() => handleDelete(tag.id)} className="hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
