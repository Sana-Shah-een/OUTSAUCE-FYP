"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BentoCard } from "@/components/ui/bento-card";
import { Search, Users, Network, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createRealtimeAuthedClient } from "@/lib/supabase/realtime";

export interface DashboardData {
  userName?: string;
  activeHunts: number;
  leadsUsed: number;
  leadsLimit: number;
  networkMatches: number;
  aiUsed: number;
  aiLimit: number;
  plan: string;
  profileComplete: boolean;
  hasHunt: boolean;
  hasLead: boolean;
  hasConnection: boolean;
}

function formatLimit(used: number, limit: number): string {
  if (!isFinite(limit)) return `${used}`;
  return `${used} / ${limit}`;
}

function planLabel(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardData>(data);

  useEffect(() => {
    setMetrics(data);
  }, [data]);

  const fetchLatestMetrics = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) return;

      const [
        activeHuntsRes,
        huntCountRes,
        leadCountRes,
        aiCountRes,
        subscriptionRes,
        usageRes,
        connectionsRes,
      ] = await Promise.all([
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

      const actualLeadsCount = leadCountRes.count ?? 0;
      const actualAiCount = aiCountRes.count ?? 0;
      const usageLeads = usageRes.data?.leads_used ?? 0;
      const usageAi = usageRes.data?.ai_generations_used ?? 0;

      setMetrics((prev) => ({
        ...prev,
        activeHunts: activeHuntsRes.count ?? 0,
        hasHunt: (huntCountRes.count ?? 0) > 0,
        hasLead: actualLeadsCount > 0,
        leadsUsed: usageLeads,
        aiUsed: usageAi,
        networkMatches: connectionsRes.count ?? 0,
        hasConnection: (connectionsRes.count ?? 0) > 0,
        plan: subscriptionRes.data?.plan ?? prev.plan,
      }));
    } catch (err) {
      console.error('Failed to fetch real-time dashboard metrics', err);
    }
  }, []);

  useEffect(() => {
    fetchLatestMetrics();

    // Polling interval every 4 seconds as a fallback
    const interval = setInterval(() => {
      fetchLatestMetrics();
    }, 4_000);

    // Realtime WebSocket subscription for instant updates on database changes
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const { supabase, unsubscribeAuth } = await createRealtimeAuthedClient();

        const channel = supabase
          .channel('dashboard-realtime-metrics')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'scrape_jobs' },
            () => fetchLatestMetrics(),
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'leads' },
            () => fetchLatestMetrics(),
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'ai_generations' },
            () => fetchLatestMetrics(),
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'usage' },
            () => fetchLatestMetrics(),
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'connections' },
            () => fetchLatestMetrics(),
          )
          .subscribe();

        cleanup = () => {
          supabase.removeChannel(channel);
          unsubscribeAuth();
        };
      } catch (e) {
        // Fallback to polling if realtime fails
      }
    })();

    return () => {
      clearInterval(interval);
      if (cleanup) cleanup();
    };
  }, [fetchLatestMetrics]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="space-y-8 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-4xl">
          Welcome back{metrics.userName ? `, ${metrics.userName}` : ''}
        </h1>
        <p className="mt-2 text-base text-text-muted">
          Here is what's happening with your account today.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <DashboardMetricCard
          title="Active Hunts"
          value={metrics.activeHunts.toString()}
          description={metrics.activeHunts === 0 ? 'No hunts running right now' : 'Running hunts'}
          icon={<Search className="h-5 w-5 text-brand-red" />}
          iconContainerClass="bg-brand-red/10 border-brand-red/20 text-brand-red"
          delay={0.1}
        />
        <DashboardMetricCard
          title="Leads Saved"
          value={formatLimit(metrics.leadsUsed, metrics.leadsLimit)}
          description={`${planLabel(metrics.plan)} tier this month`}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          iconContainerClass="bg-blue-500/10 border-blue-500/20 text-blue-500"
          delay={0.2}
        />
        <DashboardMetricCard
          title="Connections"
          value={metrics.networkMatches.toString()}
          description={metrics.networkMatches === 0 ? 'Build your network' : 'Accepted connections'}
          icon={<Network className="h-5 w-5 text-emerald-500" />}
          iconContainerClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
          delay={0.3}
        />
        <DashboardMetricCard
          title="AI Generations"
          value={formatLimit(metrics.aiUsed, metrics.aiLimit)}
          description="Content generated this month"
          icon={<Sparkles className="h-5 w-5 text-amber-500" />}
          iconContainerClass="bg-amber-500/10 border-amber-500/20 text-amber-500"
          delay={0.4}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BentoCard delay={0.5} className="h-full">
            <h2 className="text-xl font-bold mb-6 text-text-main">Getting Started</h2>
            <div className="space-y-6">
              <Step
                number={1}
                title="Set up your profile"
                description="Tell us about your role and interests to get better matches."
                isCompleted={metrics.profileComplete}
                href="/settings"
              />
              <Step
                number={2}
                title="Configure a hunt"
                description="Choose platforms and keywords to search for opportunities."
                isCompleted={metrics.hasHunt}
                href="/hunts"
              />
              <Step
                number={3}
                title="Save leads"
                description="Save the best results and organize them in your pipeline."
                isCompleted={metrics.hasLead}
                href="/leads"
              />
              <Step
                number={4}
                title="Connect with others"
                description="Find people with matching interests in the network."
                isCompleted={metrics.hasConnection}
                href="/network"
              />
            </div>
          </BentoCard>
        </div>

        <div className="lg:col-span-1">
          <BentoCard delay={0.6} className="h-full relative overflow-hidden group/actions">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-red/20 dark:bg-brand-red/30 rounded-full blur-3xl opacity-50 group-hover/actions:opacity-100 transition-opacity duration-700" />
            <h2 className="text-xl font-bold mb-4 text-text-main relative z-10">Quick Actions</h2>
            <div className="flex flex-col gap-3 relative z-10">
              <ActionButton label="New Hunt" icon={<Search className="h-4 w-4" />} href="/hunts" />
              <ActionButton label="Generate Content" icon={<Sparkles className="h-4 w-4" />} href="/ai-tools" />
              <ActionButton label="Browse Network" icon={<Network className="h-4 w-4" />} href="/network" />
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}

function DashboardMetricCard({ title, value, description, icon, iconContainerClass, delay }: any) {
  return (
    <BentoCard delay={delay} className="p-6 relative group overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-current to-transparent opacity-[0.03] rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500" style={{ color: 'inherit' }} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <p className="text-sm font-medium text-text-muted">{title}</p>
        <div className={`p-2.5 rounded-xl border shadow-sm transition-transform duration-300 group-hover:scale-110 ${iconContainerClass || 'bg-white/50 dark:bg-black/20 border-black/[0.08] dark:border-white/[0.1]'}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight text-text-main">{value}</p>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
    </BentoCard>
  );
}

function Step({ number, title, description, isCompleted, href }: any) {
  const content = (
    <div className={`group flex items-start gap-4 ${href ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-3 -m-3 rounded-xl transition-colors' : ''}`}>
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 shadow-sm ${
        isCompleted
          ? 'border-brand-red bg-brand-red text-white shadow-[0_0_15px_rgba(196,30,30,0.3)]'
          : 'border-black/10 dark:border-white/10 bg-white dark:bg-black/40 text-text-muted group-hover:border-brand-red/50 group-hover:text-brand-red group-hover:shadow-[0_0_10px_rgba(196,30,30,0.2)]'
      }`}>
        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-sm font-medium">{number}</span>}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={`text-base font-semibold transition-colors ${isCompleted ? 'text-text-muted line-through' : href ? 'group-hover:text-brand-red' : 'text-text-main'}`}>{title}</p>
          {href && !isCompleted && <ArrowRight className="h-4 w-4 text-brand-red opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />}
        </div>
        <p className="text-sm text-text-muted mt-1">{description}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function ActionButton({ label, icon, href }: any) {
  const content = (
    <button className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-white/40 dark:bg-white/[0.02] hover:bg-white/80 dark:hover:bg-white/[0.06] border border-white/50 dark:border-white/5 hover:border-brand-red/30 dark:hover:border-brand-red/40 shadow-sm transition-all duration-300 text-left group">
      <div className="p-2 rounded-lg bg-black/[0.03] dark:bg-white/5 text-text-muted group-hover:bg-brand-red group-hover:text-white group-hover:shadow-[0_0_15px_rgba(196,30,30,0.4)] transition-all duration-300">
        {icon}
      </div>
      <span className="font-semibold text-sm text-text-main group-hover:text-brand-red transition-colors">{label}</span>
    </button>
  );

  if (href) {
    return <Link href={href} className="block w-full">{content}</Link>;
  }
  return content;
}
