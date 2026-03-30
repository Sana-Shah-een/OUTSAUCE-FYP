import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async getSubscriptionAndUsage(userId: string) {
    const sb = this.supabaseService.getAdminClient();
    const now = new Date().toISOString();

    const [{ data: subscription }, { data: usage }] = await Promise.all([
      sb
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single(),
      sb
        .from('usage')
        .select('*')
        .eq('user_id', userId)
        .lte('period_start', now)
        .gt('period_end', now)
        .single(),
    ]);

    return {
      subscription: subscription ?? { plan: 'free' },
      usage: usage ?? null,
    };
  }

  async createCheckoutSession(
    userId: string,
    plan: 'starter' | 'pro' | 'enterprise',
  ) {
    // TODO: Replace with actual Stripe SDK integration
    this.logger.log(
      `Creating checkout session for user ${userId}, plan: ${plan}`,
    );

    return {
      url: `https://checkout.stripe.com/mock-session?user=${userId}&plan=${plan}`,
    };
  }

  async createPortalSession(userId: string) {
    // TODO: Replace with actual Stripe SDK integration
    this.logger.log(`Creating portal session for user ${userId}`);

    return {
      url: `https://billing.stripe.com/mock-portal?user=${userId}`,
    };
  }

  async handleStripeWebhook(event: Record<string, unknown>) {
    this.logger.log(`Received Stripe webhook event: ${event.type}`);

    // TODO: Handle subscription lifecycle events
    return { received: true };
  }
}
