import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { User } from '@supabase/supabase-js';

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

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...input,
        onboarding_completed: true,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateProfile(user: User, input: Record<string, unknown>) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('profiles')
      .update(input)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
