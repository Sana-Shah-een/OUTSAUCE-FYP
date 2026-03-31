'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="flex h-14 items-center gap-2 border-b bg-card px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4" />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {userEmail}
        </span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {userEmail?.charAt(0).toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
