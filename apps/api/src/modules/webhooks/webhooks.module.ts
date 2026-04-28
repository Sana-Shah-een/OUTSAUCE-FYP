import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [SupabaseModule],
  providers: [WebhooksService],
  controllers: [WebhooksController],
  exports: [WebhooksService],
})
export class WebhooksModule {}
