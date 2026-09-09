'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  Cpu,
  Mailbox,
  LogOut,
  ArrowLeft,
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
  { href: '/admin', label: 'Platform Analytics', icon: LayoutDashboard },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/billing', label: 'Billing Overview', icon: CreditCard },
  { href: '/admin/hunts', label: 'Hunting Health', icon: Activity },
  { href: '/admin/ai', label: 'AI Usage & Costs', icon: Cpu },
  { href: '/admin/contact', label: 'Support Inbox', icon: Mailbox },
];

export function AdminSidebar() {
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

  return (
    <Sidebar collapsible="icon" className="bg-black/[0.02] dark:bg-[#020617]/80 border-r border-black/[0.06] dark:border-white/[0.06] backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      <SidebarHeader className="p-4 flex items-center justify-center">
        <Link href="/admin" className="flex items-center gap-2 group outline-none">
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
          <SidebarGroupLabel className="text-brand-red font-semibold uppercase tracking-wider">Admin System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard" />} tooltip="Back to User App">
              <ArrowLeft />
              <span>Exit Admin</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
