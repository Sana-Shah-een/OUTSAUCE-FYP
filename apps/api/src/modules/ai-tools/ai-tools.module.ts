import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AiToolsService } from './ai-tools.service';
import { AiToolsController } from './ai-tools.controller';

@Module({
  imports: [SupabaseModule],
  providers: [AiToolsService],
  controllers: [AiToolsController],
})
export class AiToolsModule {}
