'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BentoCard } from '@/components/ui/bento-card';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, CheckCircle2, XCircle, RefreshCw, Activity, Terminal } from 'lucide-react';

interface ScrapeStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
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

export default function AdminScrapesPage() {
  const [data, setData] = useState<ScrapeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScrapes() {
      try {
        const response = await apiClient<ScrapeStats>('/api/admin/scrapes');
        setData(response);
      } catch (error) {
        console.error('Failed to fetch scrapes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchScrapes();
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
            <Activity className="h-5 w-5 text-brand-red" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-4xl">
            Hunting Health
          </h1>
        </div>
        <p className="text-base text-text-muted">
          Monitor global n8n infrastructure and job execution success rates.
        </p>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <DashboardMetricCard 
          title="Total Jobs" 
          value={loading ? "..." : data?.total || 0} 
          description="Cumulative executions" 
          icon={<Search className="h-5 w-5 text-brand-red" />}
          iconContainerClass="bg-brand-red/10 border-brand-red/20 text-brand-red"
          delay={0.1}
        />
        <DashboardMetricCard 
          title="Completed" 
          value={loading ? "..." : data?.completed || 0} 
          description="Successfully finished" 
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          iconContainerClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
          delay={0.2}
        />
        <DashboardMetricCard 
          title="Running" 
          value={loading ? "..." : data?.running || 0} 
          description="Active n8n instances" 
          icon={<RefreshCw className="h-5 w-5 text-blue-500 animate-[spin_4s_linear_infinite]" />}
          iconContainerClass="bg-blue-500/10 border-blue-500/20 text-blue-500"
          delay={0.3}
        />
        <DashboardMetricCard 
          title="Failed" 
          value={loading ? "..." : data?.failed || 0} 
          description="Critical job errors" 
          icon={<XCircle className="h-5 w-5 text-brand-red" />}
          iconContainerClass="bg-brand-red/10 border-brand-red/20 text-brand-red"
          delay={0.4}
        />
      </motion.div>

      <BentoCard delay={0.5} className="overflow-hidden group/logs">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            <Terminal className="w-5 h-5 text-brand-red" /> Real-time Status
          </h2>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Infrastructure Online
          </div>
        </div>
        <div className="space-y-4">
          {(() => {
            const running = data?.running ?? 0;
            const failed = data?.failed ?? 0;
            const total = data?.total ?? 0;
            const failureRate = total > 0 ? failed / total : 0;
            const hunterStatus = failureRate > 0.5
              ? { label: 'Degraded', color: 'text-amber-500', dot: 'bg-amber-500' }
              : { label: 'Operational', color: 'text-emerald-500', dot: 'bg-emerald-500' };
            const queueStatus = running > 0
              ? { label: `${running} active`, color: 'text-blue-500', dot: 'bg-blue-500' }
              : { label: 'Idle', color: 'text-emerald-500', dot: 'bg-emerald-500' };
            return (
              <>
                <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between group-hover/logs:bg-black/[0.04] dark:group-hover/logs:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${hunterStatus.dot}`} />
                    <span className="text-sm font-semibold text-text-main">Web Hunter Node</span>
                  </div>
                  <span className={`text-xs font-medium ${hunterStatus.color} uppercase`}>{hunterStatus.label}</span>
                </div>
                <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between group-hover/logs:bg-black/[0.04] dark:group-hover/logs:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${queueStatus.dot}`} />
                    <span className="text-sm font-semibold text-text-main">Lead Processing Queue</span>
                  </div>
                  <span className={`text-xs font-medium ${queueStatus.color} uppercase`}>{queueStatus.label}</span>
                </div>
              </>
            );
          })()}
        </div>
      </BentoCard>
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
