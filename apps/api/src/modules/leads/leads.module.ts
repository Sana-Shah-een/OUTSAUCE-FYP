import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { SupabaseModule } from '../../supabase/supabase.module';
import { ProfileModule } from '../profile/profile.module';
import { LeadsService } from './leads.service';
import { LeadScoringService } from './lead-scoring.service';
import { LeadsController } from './leads.controller';

@Module({
  imports: [BillingModule, SupabaseModule, ProfileModule],
  providers: [LeadsService, LeadScoringService],
  controllers: [LeadsController],
  exports: [LeadsService, LeadScoringService],
})
export class LeadsModule {}
