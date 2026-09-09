'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createRealtimeAuthedClient } from '@/lib/supabase/realtime';
import {
  LayoutDashboard,
  Search,
  Users,
  Globe,
  MessageSquare,
  Sparkles,
  Settings,
  CreditCard,
  LogOut,
  Bell,
  Shield,
} from 'lucide-react';
import { OutsauceLogo } from '@/components/OutsauceLogo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/hunts', label: 'Hunts', icon: Search },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/network', label: 'Network', icon: Globe },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/ai-tools', label: 'AI Tools', icon: Sparkles },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during sign out:', err);
    } finally {
      window.location.href = '/login';
    }
  }

  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUnread = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const [profileRes, countRes] = await Promise.all([
      supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
      supabase.from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
    ]);

    if (profileRes.data?.is_admin) setIsAdmin(true);
    if (countRes.count !== null) setUnreadCount(countRes.count);
  }, []);

  useEffect(() => {
    fetchUnread();
    let cancelled = false;
    let cleanup: (() => void) | null = null;
    (async () => {
      const { supabase, unsubscribeAuth } = await createRealtimeAuthedClient();
      if (cancelled) {
        unsubscribeAuth();
        return;
      }
      const ch = supabase
        .channel('sidebar-notif')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchUnread())
        .subscribe();
      cleanup = () => {
        supabase.removeChannel(ch);
        unsubscribeAuth();
      };
    })();
    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [fetchUnread]);

  return (
    <Sidebar collapsible="icon" className="bg-black/[0.02] dark:bg-[#020617]/80 border-r border-black/[0.06] dark:border-white/[0.06] backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      <SidebarHeader className="p-4 flex items-center justify-center">
        <Link href="/dashboard" className="flex items-center gap-2 group outline-none">
          <div className="group-data-[collapsible=icon]:hidden w-full pl-1">
            <OutsauceLogo className="h-10 transition-transform duration-300 group-hover:scale-105" />
          </div>
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-14 h-14 rounded-full bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 shadow-sm group-hover:border-brand-red/40 group-hover:shadow-[0_0_15px_rgba(196,30,30,0.2)] transition-all duration-300">
            <OutsauceLogo className="h-6 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                      className={isActive ? "bg-gradient-to-r from-brand-red/10 to-transparent text-brand-red font-medium relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-brand-red" : "text-text-muted transition-colors hover:text-text-main"}
                    >
                      <item.icon className={isActive ? "text-brand-red" : ""} />
                      <span>{item.label}</span>
                      {item.href === '/notifications' && unreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white px-1.5">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive}
                  tooltip={item.label}
                  className={isActive ? "bg-gradient-to-r from-brand-red/10 to-transparent text-brand-red font-medium relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-brand-red" : "text-text-muted transition-colors hover:text-text-main"}
                >
                  <item.icon className={isActive ? "text-brand-red" : ""} />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/admin" />}
                tooltip="Admin Panel"
                className="text-text-muted transition-colors hover:text-brand-red hover:bg-brand-red/10"
              >
                <Shield className="text-brand-red" />
                <span className="text-brand-red font-medium">Admin Panel</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign out">
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
