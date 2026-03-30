export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Usage {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  leads_used: number;
  scrapes_used: number;
  ai_generations_used: number;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  leads_per_month: number;
  scrapes_per_month: number;
  ai_generations_per_month: number;
}
