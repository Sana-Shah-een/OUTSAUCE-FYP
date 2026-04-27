import { Body, Controller, Get, Post, UseGuards, Req, Headers, RawBodyRequest } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { z } from 'zod';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BillingService } from './billing.service';

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'enterprise']),
});

type CheckoutInput = z.infer<typeof checkoutSchema>;

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @UseGuards(SupabaseAuthGuard)
  getSubscription(@CurrentUser() user: User) {
    return this.billingService.getSubscriptionAndUsage(user.id);
  }

  @Post('checkout')
  @UseGuards(SupabaseAuthGuard)
  createCheckout(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(checkoutSchema)) input: CheckoutInput,
  ) {
    return this.billingService.createCheckoutSession(user.id, input.plan);
  }

  @Post('portal')
  @UseGuards(SupabaseAuthGuard)
  createPortal(@CurrentUser() user: User) {
    return this.billingService.createPortalSession(user.id);
  }

  @Post('webhooks/stripe')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleStripeWebhook(signature, req.rawBody);
  }
}
