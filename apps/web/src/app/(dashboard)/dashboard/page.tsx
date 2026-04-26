import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './client-page';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <DashboardClient userName={user?.user_metadata?.full_name} />;
}
