'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BentoCard } from '@/components/ui/bento-card';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, BarChart3, Activity, PieChart, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingData {
  estimatedMrr: number;
  distribution: {
    free: number;
    starter: number;
    pro: number;
    enterprise: number;
  };
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

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const response = await apiClient<BillingData>('/api/admin/billing');
        setData(response);
      } catch (error) {
        console.error('Failed to fetch billing:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  const totalPaid = (data?.distribution?.starter || 0) + (data?.distribution?.pro || 0) + (data?.distribution?.enterprise || 0);

  return (
    <div className="space-y-8 pb-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-brand-red/10 border border-brand-red/20">
            <DollarSign className="h-5 w-5 text-brand-red" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-4xl">
            Billing Management
          </h1>
        </div>
        <p className="text-base text-text-muted">
          Global financial health, MRR tracking, and user tier distribution.
        </p>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <DashboardMetricCard 
          title="Estimated MRR" 
          value={loading ? "..." : `$${data?.estimatedMrr || 0}`} 
          description="Monthly Recurring Revenue" 
          icon={<TrendingUp className="h-5 w-5 text-brand-red" />}
          iconContainerClass="bg-brand-red/10 border-brand-red/20 text-brand-red"
          delay={0.1}
        />
        <DashboardMetricCard 
          title="Paid Subscriptions" 
          value={loading ? "..." : totalPaid} 
          description="Active Starter, Pro & Enterprise" 
          icon={<Activity className="h-5 w-5 text-blue-500" />}
          iconContainerClass="bg-blue-500/10 border-blue-500/20 text-blue-500"
          delay={0.2}
        />
        <DashboardMetricCard 
          title="Plan Distribution" 
          value={loading ? "..." : data?.distribution?.free || 0} 
          description="Free tier users" 
          icon={<PieChart className="h-5 w-5 text-emerald-500" />}
          iconContainerClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
          delay={0.3}
        />
      </motion.div>

      <div className="pt-4">
        <h2 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-red" /> Subscription Tiers
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {['free', 'starter', 'pro', 'enterprise'].map((tier, idx) => (
            <BentoCard 
              key={tier} 
              delay={0.4 + (idx * 0.1)}
              className="p-6 relative group overflow-hidden border-none shadow-2xl"
            >
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-brand-red/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
              <h3 className="text-text-muted capitalize mb-4 font-bold text-xs tracking-widest">{tier} Tier</h3>
              {loading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-text-main group-hover:text-brand-red transition-colors">
                    {data?.distribution[tier as keyof BillingData['distribution']] || 0}
                  </span>
                  <span className="text-xs font-medium text-text-muted">users</span>
                </div>
              )}
              <div className="mt-4 h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${loading ? 0 : (data?.distribution[tier as keyof BillingData['distribution']] || 0) / 100 * 100}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className={cn("h-full bg-brand-red shadow-[0_0_10px_rgba(196,30,30,0.4)]")}
                />
              </div>
            </BentoCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardMetricCard({ title, value, description, icon, iconContainerClass, delay }: any) {
  return (
    <BentoCard delay={delay} className="p-6 relative group overflow-hidden border-none shadow-2xl">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-current to-transparent opacity-[0.03] rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-500" style={{ color: 'inherit' }} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <p className="text-sm font-bold text-text-muted uppercase tracking-wider">{title}</p>
        <div className={`p-2.5 rounded-xl border shadow-sm transition-transform duration-300 group-hover:scale-110 ${iconContainerClass || 'bg-white/50 dark:bg-black/20 border-black/[0.08] dark:border-white/[0.1]'}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-4xl font-extrabold tracking-tight text-text-main">{value}</p>
        <p className="mt-1 text-sm text-text-muted font-medium">{description}</p>
      </div>
    </BentoCard>
  );
}
