import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { sendRealtimeBroadcast } from '../../supabase/realtime-broadcast';

@Injectable()
export class MessagesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createConversation(userId: string, recipientId: string) {
    const sb = this.supabaseService.getAdminClient();

    if (userId === recipientId) {
      throw new ForbiddenException('Cannot start a conversation with yourself');
    }

    const { data: connection } = await sb
      .from('connections')
      .select('id')
      .eq('status', 'accepted')
      .or(
        `and(requester_id.eq.${userId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${userId})`,
      )
      .limit(1)
      .maybeSingle();

    if (!connection) {
      throw new ForbiddenException(
        'You can only message users you are connected with',
      );
    }

    const { data: userConversations } = await sb
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    const userConvIds = (userConversations ?? []).map(
      (c) => c.conversation_id,
    );

    if (userConvIds.length > 0) {
      const { data: recipientParticipation } = await sb
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', recipientId)
        .in('conversation_id', userConvIds)
        .limit(1)
        .maybeSingle();

      if (recipientParticipation) {
        const { data: existing } = await sb
          .from('conversations')
          .select('*')
          .eq('id', recipientParticipation.conversation_id)
          .single();

        return existing;
      }
    }

    const { data: conversation, error: convError } = await sb
      .from('conversations')
      .insert({})
      .select('*')
      .single();

    if (convError || !conversation) throw convError;

    const { error: partError } = await sb
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: userId },
        { conversation_id: conversation.id, user_id: recipientId },
      ]);

    if (partError) throw partError;

    return conversation;
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const sb = this.supabaseService.getAdminClient();

    const { data: participant } = await sb
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!participant) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    const { data: message, error: msgError } = await sb
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
      })
      .select('*')
      .single();

    if (msgError) throw msgError;

    await sb
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    const url = this.supabaseService.getUrl();
    const key = this.supabaseService.getServiceRoleKey();
    const broadcasts: Promise<void>[] = [
      sendRealtimeBroadcast(
        url,
        key,
        `conversation:${conversationId}`,
        'new_message',
        message,
      ),
    ];

    const { data: allParticipants } = await sb
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);

    for (const p of allParticipants ?? []) {
      broadcasts.push(
        sendRealtimeBroadcast(
          url,
          key,
          `user:${p.user_id}`,
          'inbox_update',
          { conversation_id: conversationId, message },
        ),
      );
    }

    Promise.all(broadcasts).catch(() => {});

    return message;
  }

  async getConversations(userId: string) {
    const sb = this.supabaseService.getAdminClient();

    const { data: participations } = await sb
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    const convIds = (participations ?? []).map((p) => p.conversation_id);
    const lastReadByConv = new Map<string, string | null>(
      (participations ?? []).map((p) => [p.conversation_id, p.last_read_at]),
    );

    if (convIds.length === 0) {
      return [];
    }

    const { data: conversations, error } = await sb
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const { data: allParticipants } = await sb
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds)
      .neq('user_id', userId);

    const otherUserIds = [
      ...new Set((allParticipants ?? []).map((p) => p.user_id)),
    ];

    let profilesMap: Record<string, unknown> = {};
    if (otherUserIds.length > 0) {
      const { data: profiles } = await sb
        .from('profiles')
        .select('id, full_name, avatar_url, headline')
        .in('id', otherUserIds);

      profilesMap = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, p]),
      );
    }

    const participantsByConv = new Map<string, unknown[]>();
    for (const p of allParticipants ?? []) {
      const list = participantsByConv.get(p.conversation_id) ?? [];
      list.push(profilesMap[p.user_id] ?? { id: p.user_id });
      participantsByConv.set(p.conversation_id, list);
    }

    const enriched = await Promise.all(
      (conversations ?? []).map(async (conv) => {
        const { data: lastMsg } = await sb
          .from('messages')
          .select('id, content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const lastReadAt = lastReadByConv.get(conv.id);
        let unread = false;
        if (lastMsg && lastMsg.sender_id !== userId) {
          if (!lastReadAt) {
            unread = true;
          } else {
            unread =
              new Date(lastMsg.created_at).getTime() >
              new Date(lastReadAt).getTime();
          }
        }

        return {
          ...conv,
          participants: participantsByConv.get(conv.id) ?? [],
          last_message: lastMsg ?? null,
          unread,
        };
      }),
    );

    return enriched;
  }

  async getMessages(
    userId: string,
    conversationId: string,
    page: number,
    limit: number,
  ) {
    const sb = this.supabaseService.getAdminClient();

    const { data: participant } = await sb
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!participant) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    const offset = (page - 1) * limit;

    const { data, count, error } = await sb
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { data: data ?? [], total: count ?? 0, page, limit };
  }

  async markAsRead(userId: string, conversationId: string) {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !data) {
      throw new NotFoundException('Conversation participation not found');
    }

    return data;
  }
}
