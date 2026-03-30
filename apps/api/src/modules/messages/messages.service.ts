import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class MessagesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createConversation(userId: string, recipientId: string) {
    const sb = this.supabaseService.getAdminClient();

    // Check if conversation already exists between these two users
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
        // Return existing conversation
        const { data: existing } = await sb
          .from('conversations')
          .select('*')
          .eq('id', recipientParticipation.conversation_id)
          .single();

        return existing;
      }
    }

    // Create new conversation
    const { data: conversation, error: convError } = await sb
      .from('conversations')
      .insert({})
      .select('*')
      .single();

    if (convError || !conversation) throw convError;

    // Add both participants
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

    // Verify user is a participant
    const { data: participant } = await sb
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!participant) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    // Insert message
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

    // Update conversation updated_at
    await sb
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return message;
  }

  async getConversations(userId: string) {
    const sb = this.supabaseService.getAdminClient();

    // Get conversation IDs the user participates in
    const { data: participations } = await sb
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    const convIds = (participations ?? []).map((p) => p.conversation_id);

    if (convIds.length === 0) {
      return [];
    }

    // Get conversations
    const { data: conversations, error } = await sb
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Get other participants' profiles for display
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
        .select('*')
        .in('id', otherUserIds);

      profilesMap = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, p]),
      );
    }

    // Map participant profiles onto conversations
    const participantsByConv = new Map<string, unknown[]>();
    for (const p of allParticipants ?? []) {
      const list = participantsByConv.get(p.conversation_id) ?? [];
      list.push(profilesMap[p.user_id] ?? { id: p.user_id });
      participantsByConv.set(p.conversation_id, list);
    }

    return (conversations ?? []).map((conv) => ({
      ...conv,
      participants: participantsByConv.get(conv.id) ?? [],
    }));
  }

  async getMessages(
    userId: string,
    conversationId: string,
    page: number,
    limit: number,
  ) {
    const sb = this.supabaseService.getAdminClient();

    // Verify participation
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
