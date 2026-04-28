import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { User } from '@supabase/supabase-js';

const ALLOWED_PROFILE_FIELDS = new Set([
  'full_name',
  'user_type',
  'headline',
  'bio',
  'interests',
  'skills',
  'location',
  'linkedin_url',
  'website_url',
  'avatar_url',
  'is_discoverable',
]);

function sanitizeProfileInput(input: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    if (ALLOWED_PROFILE_FIELDS.has(key)) {
      sanitized[key] = input[key];
    }
  }
  return sanitized;
}

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getProfile(user: User) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Profile not found');
    }

    return data;
  }

  async completeOnboarding(user: User, input: Record<string, unknown>) {
    const supabase = this.supabaseService.getAdminClient();
    const sanitized = sanitizeProfileInput(input);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...sanitized,
        onboarding_completed: true,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async updateProfile(user: User, input: Record<string, unknown>) {
    const supabase = this.supabaseService.getAdminClient();
    const sanitized = sanitizeProfileInput(input);

    if (Object.keys(sanitized).length === 0) {
      throw new BadRequestException('No valid fields to update');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(sanitized)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async updatePassword(user: User, password: string) {
    const supabase = this.supabaseService.getAdminClient();

    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true };
  }

  async deleteAccount(user: User) {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true };
  }
}
