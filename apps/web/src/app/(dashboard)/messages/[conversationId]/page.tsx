'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status: string;
  created_at: string;
}

interface MessagesResponse {
  data: Message[];
  total: number;
}

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages: realtimeMessages, setMessages: setRealtimeMessages } =
    useRealtimeMessages(conversationId);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    getUser();
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const data = await apiClient<MessagesResponse>(
          `/api/messages/conversations/${conversationId}?limit=100`,
        );
        setInitialMessages(data.data);
        setRealtimeMessages([]);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [conversationId, setRealtimeMessages]);

  useEffect(() => {
    if (!conversationId) return;
    apiClient(`/api/messages/conversations/${conversationId}/read`, {
      method: 'PATCH',
    }).catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [initialMessages, realtimeMessages]);

  const allMessages = (() => {
    const initialIds = new Set(initialMessages.map((m) => m.id));
    return [
      ...initialMessages,
      ...realtimeMessages.filter((rm) => !initialIds.has(rm.id)),
    ];
  })();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      await apiClient(`/api/messages/conversations/${conversationId}`, {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      });
      setContent('');
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Button variant="ghost" size="sm" render={<Link href="/messages" />}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Conversation</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <div className="space-y-3 px-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-3/4" />
            ))}
          </div>
        ) : allMessages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            No messages yet. Start the conversation!
          </p>
        ) : (
          allMessages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`mt-1 text-xs ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 border-t pt-4"
      >
        <Input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" disabled={!content.trim() || sending} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
