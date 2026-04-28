import type { PlanLimits, PlanTier } from '../types/billing';

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { leads_per_month: 20, scrapes_per_month: 5, ai_generations_per_month: 10 },
  starter: { leads_per_month: 200, scrapes_per_month: 50, ai_generations_per_month: 100 },
  pro: { leads_per_month: -1, scrapes_per_month: -1, ai_generations_per_month: -1 },
  enterprise: { leads_per_month: -1, scrapes_per_month: -1, ai_generations_per_month: -1 },
};

export function isWithinLimit(used: number, limit: number): boolean {
  return limit === -1 || used < limit;
}
