import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';

@Module({
  imports: [SupabaseModule],
  providers: [ExportService],
  controllers: [ExportController],
})
export class ExportModule {}
