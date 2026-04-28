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

    const { data: currentProfile } = await sb
      .from('profiles')
      .select('interests, skills')
      .eq('id', userId)
      .single();

    const userInterests: string[] = currentProfile?.interests ?? [];
    const userSkills: string[] = currentProfile?.skills ?? [];

    const { data: existingConnections } = await sb
      .from('connections')
      .select('requester_id, recipient_id')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

    const excludedIds = new Set<string>([userId]);
    for (const c of existingConnections ?? []) {
      excludedIds.add(c.requester_id);
      excludedIds.add(c.recipient_id);
    }

    let query = sb
      .from('profiles')
      .select(
        'id, full_name, headline, user_type, interests, skills, location, avatar_url, is_discoverable',
        { count: 'exact' },
      )
      .eq('is_discoverable', true)
      .not('id', 'in', `(${[...excludedIds].join(',')})`);

    if (user_type) {
      query = query.eq('user_type', user_type);
    }

    const { data: profiles, error } = await query;

    if (error) throw error;

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

    const offset = (page - 1) * limit;
    const paginated = scored.slice(offset, offset + limit);

    return { data: paginated, total: scored.length, page };
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

    const { data: requester } = await sb
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const requesterName = requester?.full_name?.trim() || 'Someone';

    await sb.from('notifications').insert({
      user_id: recipientId,
      type: 'network',
      title: 'New connection request',
      message: `${requesterName} wants to connect with you.`,
      link: '/network?tab=requests',
    });

    return data;
  }

  async updateConnection(
    userId: string,
    connectionId: string,
    status: 'accepted' | 'rejected',
  ) {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('connections')
      .update({ status })
      .eq('id', connectionId)
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .select('*')
      .single();

    if (error || !data) {
      throw new ForbiddenException(
        'Connection not found, already resolved, or you are not the recipient',
      );
    }

    if (status === 'accepted') {
      const { data: recipient } = await sb
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      const recipientName = recipient?.full_name?.trim() || 'Someone';

      await sb.from('notifications').insert({
        user_id: data.requester_id,
        type: 'network',
        title: 'Connection accepted',
        message: `${recipientName} accepted your connection request.`,
        link: '/network?tab=connections',
      });
    }

    return data;
  }

  async cancelRequest(userId: string, connectionId: string) {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('connections')
      .delete()
      .eq('id', connectionId)
      .eq('requester_id', userId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new NotFoundException(
        'Pending request not found or you are not the requester',
      );
    }

    return { id: data.id };
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

    const { data: connections, error } = await query;

    if (error) throw error;

    const otherIds = [
      ...new Set(
        (connections ?? []).map((c) =>
          c.requester_id === userId ? c.recipient_id : c.requester_id,
        ),
      ),
    ];

    let profilesById: Record<string, unknown> = {};
    if (otherIds.length > 0) {
      const { data: profiles } = await sb
        .from('profiles')
        .select(
          'id, full_name, headline, user_type, avatar_url, location, skills',
        )
        .in('id', otherIds);

      profilesById = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, p]),
      );
    }

    return (connections ?? []).map((c) => {
      const otherId =
        c.requester_id === userId ? c.recipient_id : c.requester_id;
      return {
        ...c,
        direction: c.requester_id === userId ? 'sent' : 'received',
        other_user: profilesById[otherId] ?? { id: otherId },
      };
    });
  }
}
