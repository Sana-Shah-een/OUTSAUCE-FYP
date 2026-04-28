'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createRealtimeAuthedClient } from '@/lib/supabase/realtime';
import { BentoCard } from '@/components/ui/bento-card';
import { MessageSquare, Network, Sparkles, AlertCircle, CheckCircle2, Bell, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: 'message' | 'network' | 'system' | 'scrape';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && !error) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    let cancelled = false;
    let cleanup: (() => void) | null = null;
    (async () => {
      const { supabase, unsubscribeAuth } = await createRealtimeAuthedClient();
      if (cancelled) {
        unsubscribeAuth();
        return;
      }
      const channel = supabase
        .channel('notifications-page')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
      cleanup = () => {
        supabase.removeChannel(channel);
        unsubscribeAuth();
      };
    })();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    setNotifications(current => current.map(n => n.id === id ? { ...n, read: true } : n));
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }

  async function markAllAsRead() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setNotifications(current => current.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  }

  async function deleteNotification(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    e.preventDefault();
    setNotifications(current => current.filter(n => n.id !== id));
    const supabase = createClient();
    await supabase.from('notifications').delete().eq('id', id);
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'network': return <Network className="h-5 w-5 text-emerald-500" />;
      case 'scrape': return <Sparkles className="h-5 w-5 text-amber-500" />;
      default: return <AlertCircle className="h-5 w-5 text-brand-red" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Notifications</h1>
          <p className="mt-1 text-sm text-text-muted">Stay updated with your latest alerts and messages.</p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-text-muted hover:text-text-main border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-xl">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-black/5 dark:bg-white/5 rounded-[32px]" />)}
        </div>
      ) : notifications.length === 0 ? (
        <BentoCard className="py-24 mt-8">
          <div className="flex flex-col items-center justify-center text-center w-full">
            <div className="h-20 w-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Bell className="h-10 w-10 text-text-muted opacity-40" />
            </div>
            <h3 className="text-xl font-semibold text-text-main">You&apos;re all caught up!</h3>
            <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
              When you receive new messages, network matches, or hunt results, they will appear here.
            </p>
          </div>
        </BentoCard>
      ) : (
        <div className="space-y-3 mt-4">
          {notifications.map((notification) => {
             const CardContent = (
               <BentoCard 
                 className={cn(
                   "p-5 md:p-6 transition-all duration-300 cursor-pointer group/notif", 
                   !notification.read 
                     ? "border-brand-red/30 shadow-[0_4px_20px_rgba(196,30,30,0.06)] bg-white/95 dark:bg-white/10 ring-1 ring-brand-red/10 hover:shadow-[0_8px_30px_rgba(196,30,30,0.12)]" 
                     : "opacity-70 hover:opacity-100 hover:shadow-md"
                 )}
               >
                 <div className="flex items-center gap-4">
                   <div className={cn(
                     "h-11 w-11 rounded-full shrink-0 flex items-center justify-center",
                     !notification.read 
                       ? "bg-white dark:bg-black/20 shadow-sm border border-black/5 dark:border-white/5" 
                       : "bg-black/5 dark:bg-white/5"
                   )}>
                     {getIcon(notification.type)}
                   </div>

                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <h4 className={cn("font-semibold text-text-main text-base truncate", !notification.read && "text-brand-red")}>
                         {notification.title}
                       </h4>
                       {!notification.read && (
                         <span className="flex h-2 w-2 shrink-0 rounded-full bg-brand-red shadow-[0_0_8px_rgba(196,30,30,0.5)]"></span>
                       )}
                     </div>
                   </div>

                   <span className="text-xs text-text-muted/70 font-medium shrink-0">
                     {formatTime(notification.created_at)}
                   </span>

                   <button
                     onClick={(e) => deleteNotification(e, notification.id)} 
                     className="p-2 rounded-full opacity-0 group-hover/notif:opacity-100 hover:bg-red-500/10 hover:text-red-500 text-text-muted transition-all duration-200 shrink-0"
                     title="Delete notification"
                   >
                     <Trash2 className="h-4 w-4" />
                   </button>
                 </div>

                 <p className="text-sm text-text-muted mt-2 ml-[60px] leading-relaxed">
                   {notification.message}
                 </p>
               </BentoCard>
             );

             if (notification.link) {
               return (
                 <Link href={notification.link} key={notification.id} onClick={() => markAsRead(notification.id)} className="block group outline-none focus:ring-2 focus:ring-brand-red rounded-[32px]">
                   {CardContent}
                 </Link>
               );
             }

             return (
               <div key={notification.id} onClick={() => markAsRead(notification.id)} className="group outline-none rounded-[32px]">
                 {CardContent}
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
}
