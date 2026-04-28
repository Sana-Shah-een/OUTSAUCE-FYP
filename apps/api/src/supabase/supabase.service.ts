import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    this.serviceRoleKey = this.configService.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  getUrl(): string {
    return this.supabaseUrl;
  }

  getServiceRoleKey(): string {
    return this.serviceRoleKey;
  }

  getAdminClient(): SupabaseClient {
    return createClient(this.supabaseUrl, this.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getUserClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.serviceRoleKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}
