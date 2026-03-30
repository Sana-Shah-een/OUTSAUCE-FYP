import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';

@Module({
  imports: [SupabaseModule],
  providers: [LeadsService],
  controllers: [LeadsController],
})
export class LeadsModule {}
