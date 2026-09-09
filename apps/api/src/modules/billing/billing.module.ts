import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { UsageService } from './usage.service';
import { UsageLimitGuard } from './usage-limit.guard';

@Module({
  imports: [SupabaseModule],
  providers: [BillingService, UsageService, UsageLimitGuard],
  controllers: [BillingController],
  exports: [UsageService, UsageLimitGuard],
})
export class BillingModule {}
