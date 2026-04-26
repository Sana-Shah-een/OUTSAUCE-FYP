'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from './notification-bell';

export function Header({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="flex h-16 items-center gap-2 border-b border-black/[0.05] dark:border-white/[0.05] bg-white/60 dark:bg-[#020617]/60 backdrop-blur-2xl px-4 sticky top-0 z-40 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
      <SidebarTrigger className="-ml-1 text-text-muted hover:text-brand-red transition-colors" />
      <Separator orientation="vertical" className="mr-2 !h-5 opacity-50" />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <NotificationBell />
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
