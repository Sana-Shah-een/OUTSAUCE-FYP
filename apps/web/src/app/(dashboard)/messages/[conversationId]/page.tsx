'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
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
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
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
        setInitialMessages([...data.data].reverse());
        setRealtimeMessages([]);
        setOptimisticMessages([]);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load messages',
        );
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

  const allMessages = useMemo(() => {
    const seen = new Map<string, Message>();
    for (const m of initialMessages) seen.set(m.id, m);
    for (const m of optimisticMessages) seen.set(m.id, m);
    for (const m of realtimeMessages) seen.set(m.id, m);
    return Array.from(seen.values()).sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [initialMessages, optimisticMessages, realtimeMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const sent = await apiClient<Message>(
        `/api/messages/conversations/${conversationId}`,
        {
          method: 'POST',
          body: JSON.stringify({ content: trimmed }),
        },
      );
      setOptimisticMessages((prev) => [...prev, sent]);
      setContent('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send message',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-center gap-3 border-b pb-4">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/messages" />}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Conversation</h1>
      </div>

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
