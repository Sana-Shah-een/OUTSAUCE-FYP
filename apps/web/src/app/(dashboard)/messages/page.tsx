'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Participant {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  id: string;
  participants: Participant[];
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread: boolean;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const data = await apiClient<Conversation[]>(
          '/api/messages/conversations',
        );
        setConversations(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-600">Your conversations</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">
            No conversations yet. Connect with someone from the{' '}
            <Link href="/network" className="text-indigo-600 hover:text-indigo-500">
              Network
            </Link>{' '}
            page.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white divide-y divide-gray-200">
          {conversations.map((conv) => {
            const other = conv.participants[0];
            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-700">
                    {(other?.full_name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${conv.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}
                    >
                      {other?.full_name || 'Unknown User'}
                    </p>
                    {conv.last_message && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {new Date(conv.last_message.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p
                      className={`text-sm truncate mt-0.5 ${conv.unread ? 'text-gray-900' : 'text-gray-500'}`}
                    >
                      {conv.last_message.content}
                    </p>
                  )}
                </div>
                {conv.unread && (
                  <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-indigo-600" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
