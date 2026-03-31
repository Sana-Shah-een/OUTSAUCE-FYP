import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [SupabaseModule],
  providers: [BillingService],
  controllers: [BillingController],
})
export class BillingModule {}
