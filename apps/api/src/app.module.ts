import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { ScrapesModule } from './modules/scrapes/scrapes.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { LeadsModule } from './modules/leads/leads.module';
import { ExportModule } from './modules/export/export.module';
import { BillingModule } from './modules/billing/billing.module';
import { NetworkModule } from './modules/network/network.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AiToolsModule } from './modules/ai-tools/ai-tools.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

import { ProfileModule } from './modules/profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    ProfileModule,
    ScrapesModule,
    WebhooksModule,
    LeadsModule,
    ExportModule,
    BillingModule,
    NetworkModule,
    MessagesModule,
    AiToolsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
