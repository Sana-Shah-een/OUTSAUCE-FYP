import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ScrapesService } from './scrapes.service';
import { ScrapesController } from './scrapes.controller';

@Module({
  imports: [SupabaseModule, WebhooksModule],
  providers: [ScrapesService],
  controllers: [ScrapesController],
})
export class ScrapesModule {}
