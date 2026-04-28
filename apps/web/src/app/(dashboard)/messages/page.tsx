'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [userId, setUserId] = useState<string | null>(null);
  const inFlight = useRef(false);

  const fetchConversations = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await apiClient<Conversation[]>(
        '/api/messages/conversations',
      );
      setConversations(data);
    } catch {
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    })();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`user:${userId}`)
      .on('broadcast', { event: 'inbox_update' }, () => {
        fetchConversations();
      })
      .subscribe();

    const onFocus = () => fetchConversations();
    window.addEventListener('focus', onFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
    };
  }, [userId, fetchConversations]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your conversations</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No conversations yet. Connect with someone from the{' '}
              <Link href="/network" className="text-primary hover:text-primary/80">
                Network
              </Link>{' '}
              page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="divide-y">
          {conversations.map((conv) => {
            const other = conv.participants[0];
            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {(other?.full_name || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${conv.unread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}
                    >
                      {other?.full_name || 'Unknown User'}
                    </p>
                    {conv.last_message && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {new Date(conv.last_message.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p
                      className={`text-sm truncate mt-0.5 ${conv.unread ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {conv.last_message.content}
                    </p>
                  )}
                </div>
                {conv.unread && (
                  <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
