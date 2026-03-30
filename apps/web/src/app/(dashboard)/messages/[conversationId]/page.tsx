'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';

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

  // Get current user
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

  // Fetch existing messages
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

  // Mark as read
  useEffect(() => {
    if (!conversationId) return;
    apiClient(`/api/messages/conversations/${conversationId}/read`, {
      method: 'PATCH',
    }).catch(() => {});
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [initialMessages, realtimeMessages]);

  const allMessages = [
    ...initialMessages,
    ...realtimeMessages.filter(
      (rm) => !initialMessages.some((im) => im.id === rm.id),
    ),
  ];

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
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <Link
          href="/messages"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Conversation</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : allMessages.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-12">
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
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`mt-1 text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}
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
        className="flex items-center gap-3 border-t border-gray-200 pt-4"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
