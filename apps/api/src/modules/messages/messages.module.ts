import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';

@Module({
  imports: [SupabaseModule],
  providers: [MessagesService],
  controllers: [MessagesController],
})
export class MessagesModule {}
