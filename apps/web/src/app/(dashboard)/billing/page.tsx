'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

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
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const currentPlan = billing?.subscription?.plan || 'free';
  const usage = billing?.usage || { leads_used: 0, scrapes_used: 0, ai_generations_used: 0 };
  const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your subscription and usage
        </p>
      </div>

      {/* Current Plan & Usage */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Current Plan</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 capitalize">
              {currentPlan}
            </p>
            {billing?.subscription?.cancel_at_period_end && (
              <p className="mt-1 text-sm text-red-600">
                Cancels at end of billing period
              </p>
            )}
          </div>
          {billing?.subscription?.stripe_subscription_id && (
            <button
              onClick={handleManageBilling}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Manage Billing
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <UsageMeter
            label="Leads"
            used={usage.leads_used}
            limit={limits.leads}
          />
          <UsageMeter
            label="Scrapes"
            used={usage.scrapes_used}
            limit={limits.scrapes}
          />
          <UsageMeter
            label="AI Generations"
            used={usage.ai_generations_used}
            limit={limits.ai}
          />
        </div>
      </div>

      {/* Plan Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Available Plans
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            return (
              <div
                key={plan.key}
                className={`relative rounded-lg border p-5 space-y-4 ${
                  plan.popular
                    ? 'border-indigo-600 ring-1 ring-indigo-600'
                    : 'border-gray-200'
                } bg-white`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-medium text-white">
                    Popular
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-500">
                      {plan.period}
                    </span>
                  </p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <svg
                        className="h-4 w-4 text-green-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => !isCurrent && handleUpgrade(plan.key)}
                  disabled={isCurrent || upgrading === plan.key}
                  className={`w-full rounded-md px-3 py-2 text-sm font-medium ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-500 cursor-default'
                      : plan.popular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : upgrading === plan.key
                      ? 'Redirecting...'
                      : 'Upgrade'}
                </button>
              </div>
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
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {used} / {isUnlimited ? 'Unlimited' : limit}
        </span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full transition-all ${
            isNearLimit ? 'bg-red-500' : 'bg-indigo-600'
          }`}
          style={{ width: isUnlimited ? '0%' : `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
