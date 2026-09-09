import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AiToolsService } from './ai-tools.service';
import { AiToolsController } from './ai-tools.controller';

@Module({
  imports: [BillingModule, SupabaseModule],
  providers: [AiToolsService],
  controllers: [AiToolsController],
})
export class AiToolsModule {}
