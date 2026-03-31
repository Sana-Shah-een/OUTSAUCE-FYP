'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    period: 'forever',
    features: ['20 leads/mo', '5 scrapes/mo', '10 AI generations/mo'],
  },
  {
    name: 'Starter',
    key: 'starter',
    price: '$19',
    period: '/month',
    features: ['200 leads/mo', '50 scrapes/mo', '100 AI generations/mo', 'CSV/JSON export'],
  },
  {
    name: 'Pro',
    key: 'pro',
    price: '$49',
    period: '/month',
    features: ['Unlimited leads', 'Unlimited scrapes', 'Unlimited AI generations', 'Priority support'],
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

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const data = await apiClient<BillingData>('/api/billing/subscription');
        setBilling(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

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
      // ignore
    } finally {
      setUpgrading(null);
    }
  }

  async function handleManageBilling() {
    try {
      const result = await apiClient<{ url: string }>('/api/billing/portal', {
        method: 'POST',
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      // ignore
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

      {/* Current Plan & Usage */}
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
              <Button variant="outline" onClick={handleManageBilling}>
                Manage Billing
              </Button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <UsageMeter label="Leads" used={usage.leads_used} limit={limits.leads} />
            <UsageMeter label="Scrapes" used={usage.scrapes_used} limit={limits.scrapes} />
            <UsageMeter label="AI Generations" used={usage.ai_generations_used} limit={limits.ai} />
          </div>
        </CardContent>
      </Card>

      {/* Plan Cards */}
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
                  'relative',
                  isPopular && 'border-primary ring-1 ring-primary'
                )}
              >
                {isPopular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
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
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? 'secondary' : isPopular ? 'default' : 'outline'}
                    onClick={() => !isCurrent && handleUpgrade(plan.key)}
                    disabled={isCurrent || upgrading === plan.key}
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
