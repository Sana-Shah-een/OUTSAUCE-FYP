import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

type EventType = 'lead_created' | 'hunt_created' | 'ai_generation';

export interface CurrentUsage {
  plan: string;
  leads: { used: number; limit: number | null };
  hunts: { used: number; limit: number | null };
  aiGenerations: { used: number; limit: number | null };
  cycleStart: string;
  cycleEnd: string;
}

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getCurrentUsage(userId: string): Promise<CurrentUsage> {
    const sb = this.supabaseService.getAdminClient();

    const { data: subscription } = await sb
      .from('subscriptions')
      .select('plan, billing_cycle_start')
      .eq('user_id', userId)
      .single();

    const planId = subscription?.plan ?? 'free';
    const cycleStart = subscription?.billing_cycle_start
      ? new Date(subscription.billing_cycle_start)
      : new Date();

    const cycleEnd = this.addOneMonth(cycleStart);

    const { data: plan } = await sb
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    const now = new Date().toISOString();
    const { data: usageRow } = await sb
      .from('usage')
      .select('leads_used, scrapes_used, ai_generations_used')
      .eq('user_id', userId)
      .lte('period_start', now)
      .gt('period_end', now)
      .maybeSingle();

    const leads = usageRow?.leads_used ?? await this.countEvents(userId, 'lead_created', cycleStart);
    const hunts = usageRow?.scrapes_used ?? await this.countEvents(userId, 'hunt_created', cycleStart);
    const aiGenerations = usageRow?.ai_generations_used ?? await this.countEvents(userId, 'ai_generation', cycleStart);

    const leadsLimit = plan?.leads_limit ?? 20;
    const huntsLimit = plan?.hunts_limit ?? 5;
    const aiLimit = plan?.ai_generations_limit ?? 10;

    return {
      plan: planId,
      leads: {
        used: leadsLimit !== null ? Math.min(leads, leadsLimit) : leads,
        limit: leadsLimit,
      },
      hunts: {
        used: huntsLimit !== null ? Math.min(hunts, huntsLimit) : hunts,
        limit: huntsLimit,
      },
      aiGenerations: {
        used: aiLimit !== null ? Math.min(aiGenerations, aiLimit) : aiLimit,
        limit: aiLimit,
      },
      cycleStart: cycleStart.toISOString(),
      cycleEnd: cycleEnd.toISOString(),
    };
  }

  async recordUsage(userId: string, eventType: EventType, metadata: Record<string, unknown> = {}) {
    const sb = this.supabaseService.getAdminClient();
    const { error } = await sb
      .from('usage_events')
.insert({ user_id: userId, event_type: eventType, metadata });
    if (error) {
      this.logger.error(`Failed to record usage event: ${error.message}`);
    }
  }

  async checkLimit(userId: string, eventType: EventType): Promise<boolean> {
    const usage = await this.getCurrentUsage(userId);
    const key = eventType === 'lead_created' ? 'leads' : eventType === 'hunt_created' ? 'hunts' : 'aiGenerations';
    const { used, limit } = usage[key];
    return limit === null || used < limit;
  }

  private async countEvents(userId: string, eventType: string, since: Date): Promise<number> {
    const sb = this.supabaseService.getAdminClient();
    const { count, error } = await sb
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', eventType)
.gte('created_at', since.toISOString());

    if (error) {
      this.logger.error(`Failed to count events: ${error.message}`);
      return 0;
    }
    return count ?? 0;
  }

  private addOneMonth(date: Date): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    return d;
  }
}
