'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  plan: string;
  stripe_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface Usage {
  leads_used: number;
  scrapes_used: number;
  ai_generations_used: number;
}

interface BillingData {
  subscription: Subscription;
  usage: Usage;
}

const PLAN_LIMITS: Record<string, { leads: number; scrapes: number; ai: number }> = {
  free: { leads: 20, scrapes: 5, ai: 10 },
  starter: { leads: 200, scrapes: 50, ai: 100 },
  pro: { leads: Infinity, scrapes: Infinity, ai: Infinity },
  enterprise: { leads: Infinity, scrapes: Infinity, ai: Infinity },
};

const PLANS = [
  {
    name: 'Free',
    key: 'free',
    price: '$0',
    period: ' / forever',
    features: ['20 leads/mo', '5 hunts/mo', '10 AI generations/mo'],
  },
  {
    name: 'Starter',
    key: 'starter',
    price: '$19',
    period: '/month',
    features: ['200 leads/mo', '50 hunts/mo', '100 AI generations/mo', 'CSV/JSON export'],
  },
  {
    name: 'Pro',
    key: 'pro',
    price: '$49',
    period: '/month',
    features: ['Unlimited leads', 'Unlimited hunts', 'Unlimited AI generations', 'Priority support'],
    popular: true,
  },
  {
    name: 'Enterprise',
    key: 'enterprise',
    price: '$99',
    period: '/month',
    features: ['Everything in Pro', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
  },
];

function BillingContent() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success) {
      toast.success('Subscription updated successfully!');
      window.history.replaceState(null, '', '/billing');
    }
    if (canceled) {
      toast.error('Checkout was canceled.');
      window.history.replaceState(null, '', '/billing');
    }

    async function fetchBilling() {
      try {
        const data = await apiClient<BillingData>('/api/billing/subscription');
        setBilling(data);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, [searchParams]);

  async function handleUpgrade(plan: string) {
    setUpgrading(plan);
    try {
      const result = await apiClient<{ url: string }>('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast.error('Failed to initiate checkout.');
    } finally {
      setUpgrading(null);
    }
  }

  async function handleManageBilling() {
    setUpgrading('portal');
    try {
      const result = await apiClient<{ url: string }>('/api/billing/portal', {
        method: 'POST',
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast.error('Failed to open billing portal.');
      setUpgrading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = billing?.subscription?.plan || 'free';
  const usage = billing?.usage || { leads_used: 0, scrapes_used: 0, ai_generations_used: 0 };
  const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and usage
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
              <p className="mt-1 text-2xl font-bold text-foreground capitalize">
                {currentPlan}
              </p>
              {billing?.subscription?.cancel_at_period_end && (
                <p className="mt-1 text-sm text-destructive">
                  Cancels at end of billing period
                </p>
              )}
            </div>
            {billing?.subscription?.stripe_subscription_id && (
              <Button variant="outline" onClick={handleManageBilling} disabled={upgrading === 'portal'}>
                {upgrading === 'portal' ? 'Redirecting...' : 'Manage Billing'}
              </Button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <UsageMeter label="Leads" used={usage.leads_used} limit={limits.leads} />
            <UsageMeter label="Hunts" used={usage.scrapes_used} limit={limits.scrapes} />
            <UsageMeter label="AI Generations" used={usage.ai_generations_used} limit={limits.ai} />
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Available Plans
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            const isPopular = 'popular' in plan && plan.popular;
            return (
              <Card
                key={plan.key}
                className={cn(
                  'relative !overflow-visible flex flex-col',
                  isPopular && 'border-brand-red ring-1 ring-brand-red shadow-[0_0_30px_rgba(196,30,30,0.15)] dark:shadow-[0_0_30px_rgba(196,30,30,0.3)]'
                )}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-red hover:bg-brand-red text-white border-none shadow-sm px-3 py-0.5 z-10">
                    Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="mt-1">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-col flex-1">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn("w-full transition-all mt-auto", isCurrent && "bg-black/5 dark:bg-white/5 border-transparent text-text-muted hover:bg-black/10 dark:hover:bg-white/10")}
                    variant={isCurrent ? 'outline' : isPopular ? 'default' : 'outline'}
                    onClick={() => !isCurrent && handleUpgrade(plan.key)}
                    disabled={isCurrent || upgrading !== null}
                  >
                    {isCurrent
                      ? 'Current Plan'
                      : upgrading === plan.key
                        ? 'Redirecting...'
                        : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div></div>}>
      <BillingContent />
    </Suspense>
  );
}

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const isUnlimited = !isFinite(limit);
  const percentage = isUnlimited ? 0 : limit > 0 ? (used / limit) * 100 : 0;
  const isNearLimit = percentage >= 80;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {used} / {isUnlimited ? 'Unlimited' : limit}
        </span>
      </div>
      <Progress
        value={isUnlimited ? 0 : Math.min(percentage, 100)}
        className={cn('h-2', isNearLimit && '[&>div]:bg-destructive')}
      />
    </div>
  );
}
