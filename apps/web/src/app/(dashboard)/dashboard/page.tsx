import { createClient } from '@/lib/supabase/server';
import { DashboardClient, type DashboardData } from './client-page';

const PLAN_LIMITS: Record<string, { leads: number; scrapes: number; ai: number }> = {
  free: { leads: 20, scrapes: 5, ai: 10 },
  starter: { leads: 200, scrapes: 50, ai: 100 },
  pro: { leads: Infinity, scrapes: Infinity, ai: Infinity },
  enterprise: { leads: Infinity, scrapes: Infinity, ai: Infinity },
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data: DashboardData = {
    userName: user?.user_metadata?.full_name,
    activeHunts: 0,
    leadsUsed: 0,
    leadsLimit: PLAN_LIMITS.free.leads,
    networkMatches: 0,
    aiUsed: 0,
    aiLimit: PLAN_LIMITS.free.ai,
    plan: 'free',
    profileComplete: false,
    hasHunt: false,
    hasLead: false,
    hasConnection: false,
  };

  if (!user) {
    return <DashboardClient data={data} />;
  }

  const now = new Date().toISOString();

  const [
    profileRes,
    activeHuntsRes,
    huntCountRes,
    leadCountRes,
    aiCountRes,
    subscriptionRes,
    usageRes,
    connectionsRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('scrape_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['pending', 'running']),
    supabase
      .from('scrape_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('ai_generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('usage')
      .select('leads_used, ai_generations_used')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .eq('status', 'accepted'),
  ]);

  const plan = subscriptionRes.data?.plan ?? 'free';
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  const actualLeadsCount = leadCountRes.count ?? 0;
  const actualAiCount = aiCountRes.count ?? 0;
  const usageLeads = usageRes.data?.leads_used ?? 0;
  const usageAi = usageRes.data?.ai_generations_used ?? 0;

  data.activeHunts = activeHuntsRes.count ?? 0;
  data.leadsUsed = usageLeads;
  data.leadsLimit = limits.leads;
  data.aiUsed = usageAi;
  data.aiLimit = limits.ai;
  data.networkMatches = connectionsRes.count ?? 0;
  data.plan = plan;
  data.profileComplete = profileRes.data?.onboarding_completed === true;
  data.hasHunt = (huntCountRes.count ?? 0) > 0;
  data.hasLead = actualLeadsCount > 0;
  data.hasConnection = (connectionsRes.count ?? 0) > 0;

  return <DashboardClient data={data} />;
}
