import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class NetworkService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async discover(
    userId: string,
    filters: { page: number; limit: number; user_type?: string },
  ) {
    const sb = this.supabaseService.getAdminClient();
    const { page, limit, user_type } = filters;

    // Get current user's profile for scoring
    const { data: currentProfile } = await sb
      .from('profiles')
      .select('interests, skills')
      .eq('id', userId)
      .single();

    const userInterests: string[] = currentProfile?.interests ?? [];
    const userSkills: string[] = currentProfile?.skills ?? [];

    // Fetch discoverable profiles
    let query = sb
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('is_discoverable', true)
      .neq('id', userId);

    if (user_type) {
      query = query.eq('user_type', user_type);
    }

    const { data: profiles, count, error } = await query;

    if (error) throw error;

    // Score and sort by overlap count
    const scored = (profiles ?? []).map((profile) => {
      const profileInterests: string[] = profile.interests ?? [];
      const profileSkills: string[] = profile.skills ?? [];

      const interestOverlap = profileInterests.filter((i: string) =>
        userInterests.includes(i),
      ).length;
      const skillOverlap = profileSkills.filter((s: string) =>
        userSkills.includes(s),
      ).length;

      return {
        ...profile,
        match_score: interestOverlap + skillOverlap,
      };
    });

    scored.sort((a, b) => b.match_score - a.match_score);

    // Paginate in memory
    const offset = (page - 1) * limit;
    const paginated = scored.slice(offset, offset + limit);

    return { data: paginated, total: count ?? 0, page };
  }

  async sendConnectionRequest(
    userId: string,
    recipientId: string,
    message?: string,
  ) {
    if (userId === recipientId) {
      throw new BadRequestException('Cannot connect with yourself');
    }

    const sb = this.supabaseService.getAdminClient();

    // Check for existing connection in either direction
    const { data: existing } = await sb
      .from('connections')
      .select('id, status')
      .or(
        `and(requester_id.eq.${userId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${userId})`,
      )
      .limit(1)
      .maybeSingle();

    if (existing) {
      throw new BadRequestException(
        `Connection already exists with status: ${existing.status}`,
      );
    }

    const { data, error } = await sb
      .from('connections')
      .insert({
        requester_id: userId,
        recipient_id: recipientId,
        status: 'pending',
        message: message ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;

    return data;
  }

  async updateConnection(
    userId: string,
    connectionId: string,
    status: 'accepted' | 'rejected',
  ) {
    const sb = this.supabaseService.getAdminClient();

    // Only the recipient can accept/reject
    const { data, error } = await sb
      .from('connections')
      .update({ status })
      .eq('id', connectionId)
      .eq('recipient_id', userId)
      .select('*')
      .single();

    if (error || !data) {
      throw new ForbiddenException(
        'Connection not found or you are not the recipient',
      );
    }

    return data;
  }

  async getConnections(userId: string, status?: string) {
    const sb = this.supabaseService.getAdminClient();

    let query = sb
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ?? [];
  }
}
