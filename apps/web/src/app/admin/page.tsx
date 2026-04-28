'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BentoCard } from '@/components/ui/bento-card';
import { apiClient } from '@/lib/api-client';
import { Users, Activity, Sparkles, Shield, BarChart3, Mailbox, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Analytics {
  totalUsers: number;
  totalLeadsSaved: number;
  totalScrapesRun: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiClient<Analytics>('/api/admin/analytics');
        setData(response);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-brand-red/10 border border-brand-red/20">
            <Shield className="h-5 w-5 text-brand-red" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-4xl">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-base text-text-muted">
          Global overview of the Outsauce platform and system health.
        </p>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <DashboardMetricCard 
          title="Total Registered Users" 
          value={loading ? "..." : data?.totalUsers || 0} 
          description="Active accounts across platform" 
          icon={<Users className="h-5 w-5 text-brand-red" />}
          iconContainerClass="bg-brand-red/10 border-brand-red/20 text-brand-red"
          delay={0.1}
        />
        <DashboardMetricCard 
          title="Global Hunts Run"
          value={loading ? "..." : data?.totalScrapesRun || 0} 
          description="Total execution count" 
          icon={<Activity className="h-5 w-5 text-blue-500" />}
          iconContainerClass="bg-blue-500/10 border-blue-500/20 text-blue-500"
          delay={0.2}
        />
        <DashboardMetricCard 
          title="Total Leads Captured" 
          value={loading ? "..." : data?.totalLeadsSaved || 0} 
          description="Global user database growth" 
          icon={<Sparkles className="h-5 w-5 text-emerald-500" />}
          iconContainerClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
          delay={0.3}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BentoCard delay={0.4} className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-main">System Health</h2>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <HealthMetric label="API Server" status="optimal" latency="124ms" />
              <HealthMetric label="Database" status="optimal" latency="45ms" />
              <HealthMetric label="N8N Webhooks" status="optimal" latency="280ms" />
              <HealthMetric label="Mail Server" status="optimal" latency="1.2s" />
            </div>
          </BentoCard>
        </div>
        
        <div className="lg:col-span-1">
          <BentoCard delay={0.5} className="h-full relative overflow-hidden group/actions">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-red/20 dark:bg-brand-red/30 rounded-full blur-3xl opacity-50 group-hover/actions:opacity-100 transition-opacity duration-700" />
            <h2 className="text-xl font-bold mb-4 text-text-main relative z-10">Quick Admin Tools</h2>
            <div className="flex flex-col gap-3 relative z-10">
              <AdminToolButton href="/admin/users" label="User Management" icon={<Users className="h-4 w-4" />} />
              <AdminToolButton href="/admin/hunts" label="Hunting Health" icon={<BarChart3 className="h-4 w-4" />} />
              <AdminToolButton href="/admin/billing" label="Billing Overview" icon={<CreditCard className="h-4 w-4" />} />
              <AdminToolButton href="/admin/contact" label="Support Inbox" icon={<Mailbox className="h-4 w-4" />} />
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

function HealthMetric({ label, status, latency }: any) {
  return (
    <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-sm font-semibold text-text-main">{label}</span>
      </div>
      <span className="text-xs font-medium text-text-muted uppercase">{latency}</span>
    </div>
  );
}

function AdminToolButton({ label, icon, href }: { label: string; icon: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-white/40 dark:bg-white/[0.02] hover:bg-white/80 dark:hover:bg-white/[0.06] border border-white/50 dark:border-white/5 hover:border-brand-red/30 dark:hover:border-brand-red/40 shadow-sm transition-all duration-300 text-left group"
    >
      <div className="p-2 rounded-lg bg-black/[0.03] dark:bg-white/5 text-text-muted group-hover:bg-brand-red group-hover:text-white group-hover:shadow-[0_0_15px_rgba(196,30,30,0.4)] transition-all duration-300">
        {icon}
      </div>
      <span className="font-semibold text-sm text-text-main group-hover:text-brand-red transition-colors">{label}</span>
    </Link>
  );
}
