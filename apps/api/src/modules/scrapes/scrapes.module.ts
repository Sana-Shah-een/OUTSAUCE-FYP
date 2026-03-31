import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { ScrapesService } from './scrapes.service';
import { ScrapesController } from './scrapes.controller';

@Module({
  imports: [SupabaseModule],
  providers: [ScrapesService],
  controllers: [ScrapesController],
})
export class ScrapesModule {}
