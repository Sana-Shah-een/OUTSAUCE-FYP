import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_mock', {
      apiVersion: '2023-10-16' as any,
    });
  }

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

  async getPlans() {
    const sb = this.supabaseService.getAdminClient();
    const { data } = await sb.from('plans').select('*');
    return data ?? [];
  }

  async createCheckoutSession(
    userId: string,
    plan: 'starter' | 'pro' | 'enterprise',
  ) {
    const sb = this.supabaseService.getAdminClient();

    const { data: profile } = await sb.from('profiles').select('email').eq('id', userId).single();
    const { data: sub } = await sb.from('subscriptions').select('stripe_customer_id').eq('user_id', userId).single();

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const priceId = this.configService.get<string>(`STRIPE_PRICE_${plan.toUpperCase()}`);
    if (!priceId) {
      throw new BadRequestException(`Price ID for plan ${plan} is not configured`);
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/billing?success=true`,
      cancel_url: `${frontendUrl}/billing?canceled=true`,
      client_reference_id: userId,
    };

    if (sub?.stripe_customer_id) {
      sessionConfig.customer = sub.stripe_customer_id;
    } else if (profile?.email) {
      sessionConfig.customer_email = profile.email;
    }

    const session = await this.stripe.checkout.sessions.create(sessionConfig);
    return { url: session.url };
  }

  async createPortalSession(userId: string) {
    const sb = this.supabaseService.getAdminClient();
    const { data: sub } = await sb.from('subscriptions').select('stripe_customer_id').eq('user_id', userId).single();

    if (!sub?.stripe_customer_id) {
      throw new BadRequestException('User does not have an active subscription');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${frontendUrl}/billing`,
    });

    return { url: session.url };
  }

  async handleStripeWebhook(signature: string, rawBody: Buffer | undefined) {
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || 'whsec_mock'
      );
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    const sb = this.supabaseService.getAdminClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.client_reference_id && session.customer && session.subscription) {
          await sb.from('subscriptions').update({
            stripe_customer_id: session.customer.toString(),
            stripe_subscription_id: session.subscription.toString(),
            billing_cycle_start: new Date().toISOString(),
          }).eq('user_id', session.client_reference_id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const { data: existing } = await sb
            .from('subscriptions')
            .select('id')
            .eq('stripe_subscription_id', invoice.subscription.toString())
            .single();
          if (existing) {
            await sb.from('subscriptions').update({
              billing_cycle_start: new Date().toISOString(),
            }).eq('id', existing.id);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer.toString();

        const priceId = subscription.items.data[0].price.id;
        let plan = 'free';
        if (priceId === this.configService.get('STRIPE_PRICE_STARTER')) plan = 'starter';
        else if (priceId === this.configService.get('STRIPE_PRICE_PRO')) plan = 'pro';
        else if (priceId === this.configService.get('STRIPE_PRICE_ENTERPRISE')) plan = 'enterprise';

        await sb.from('subscriptions').update({
          plan,
          stripe_subscription_id: subscription.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await sb.from('subscriptions').update({
          plan: 'free',
          stripe_subscription_id: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
        }).eq('stripe_customer_id', subscription.customer.toString());
        break;
      }
    }

    return { received: true };
  }
}
