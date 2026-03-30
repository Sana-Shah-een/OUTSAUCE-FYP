import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { NetworkService } from './network.service';
import { NetworkController } from './network.controller';

@Module({
  imports: [SupabaseModule],
  providers: [NetworkService],
  controllers: [NetworkController],
})
export class NetworkModule {}
