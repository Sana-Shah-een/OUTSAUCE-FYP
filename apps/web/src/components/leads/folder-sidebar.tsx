'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

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
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Folders</h3>
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors',
          selectedFolderId === null
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-muted'
        )}
      >
        All Leads
      </button>
      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onSelect(folder.id)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors',
            selectedFolderId === folder.id
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          <span
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: folder.color }}
          />
          {folder.name}
        </button>
      ))}
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New folder..."
          className="h-8 text-sm"
        />
        <Button type="submit" variant="ghost" size="icon" disabled={creating} className="h-8 w-8 flex-shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
