import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/shared/admin-sidebar';
import { Header } from '@/components/shared/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/server';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { DashboardBackground } from '@/components/dashboard/dashboard-background';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/dashboard');
  }

  return (
    <TooltipProvider>
      <DashboardBackground />
      <ThemeToggle />
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset className="bg-transparent">
          <Header userEmail={user?.email} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
