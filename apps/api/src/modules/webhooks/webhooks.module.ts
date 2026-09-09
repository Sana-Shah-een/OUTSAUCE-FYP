import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { SupabaseModule } from '../../supabase/supabase.module';
import { LeadsModule } from '../leads/leads.module';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [BillingModule, SupabaseModule, LeadsModule],
  providers: [WebhooksService],
  controllers: [WebhooksController],
  exports: [WebhooksService],
})
export class WebhooksModule {}
