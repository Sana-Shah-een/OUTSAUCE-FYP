import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { SaveProfileInput } from './dto/profile.dto';

export interface UserProfileRow {
  id: string;
  user_id: string;
  resume_text: string;
  target_roles: string[];
  skills: string[];
  updated_at: string;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getByUserId(userId: string): Promise<UserProfileRow | null> {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error fetching user profile for ${userId}: ${error.message}`);
      return null;
    }

    return data as UserProfileRow | null;
  }

  async saveProfile(userId: string, input: SaveProfileInput): Promise<UserProfileRow> {
    const sb = this.supabaseService.getAdminClient();

    const payload = {
      user_id: userId,
      resume_text: input.resume_text ?? '',
      target_roles: input.target_roles ?? [],
      skills: input.skills ?? [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await sb
      .from('user_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Failed to save profile for ${userId}: ${error.message}`);
      throw error;
    }

    return data as UserProfileRow;
  }
}
