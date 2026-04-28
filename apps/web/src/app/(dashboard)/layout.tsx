import { AppSidebar } from '@/components/shared/app-sidebar';
import { Header } from '@/components/shared/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/server';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { DashboardBackground } from '@/components/dashboard/dashboard-background';
import { redirect } from 'next/navigation';
import { Toaster } from 'sonner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profile && profile.onboarding_completed === false) {
      redirect('/onboarding');
    }
  }

  return (
    <TooltipProvider>
      <DashboardBackground />
      <ThemeToggle />
      <Toaster position="top-right" richColors closeButton />
      <SidebarProvider>
        <AppSidebar />
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
