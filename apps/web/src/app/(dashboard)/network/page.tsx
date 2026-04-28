'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, MessageSquare, Check, X, UserPlus } from 'lucide-react';

interface DiscoveredUser {
  id: string;
  full_name: string | null;
  headline: string | null;
  user_type: string;
  interests: string[];
  skills: string[];
  location: string | null;
  avatar_url: string | null;
  match_score: number;
}

interface ConnectionUser {
  id: string;
  full_name: string | null;
  headline: string | null;
  user_type: string;
  avatar_url: string | null;
  location: string | null;
  skills: string[] | null;
}

interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  created_at: string;
  direction: 'sent' | 'received';
  other_user: ConnectionUser;
}

const USER_TYPE_LABELS: Record<string, string> = {
  job_seeker: 'Job Seeker',
  freelancer: 'Freelancer',
  employer: 'Employer',
};

function NetworkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'requests' || tabParam === 'connections'
      ? tabParam
      : 'discover';

  const [tab, setTab] = useState(initialTab);
  const [users, setUsers] = useState<DiscoveredUser[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (userTypeFilter && userTypeFilter !== 'all')
        params.set('user_type', userTypeFilter);
      const data = await apiClient<{ data: DiscoveredUser[] }>(
        `/api/network/discover?${params.toString()}`,
      );
      setUsers(data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load people');
    } finally {
      setLoadingUsers(false);
    }
  }, [userTypeFilter]);

  const fetchConnections = useCallback(async () => {
    setLoadingConnections(true);
    try {
      const data = await apiClient<Connection[]>('/api/network/connections');
      setConnections(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load connections',
      );
    } finally {
      setLoadingConnections(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  async function handleConnect(recipientId: string) {
    setBusy(recipientId, true);
    try {
      await apiClient('/api/network/connect', {
        method: 'POST',
        body: JSON.stringify({ recipient_id: recipientId }),
      });
      toast.success('Connection request sent');
      setUsers((prev) => prev.filter((u) => u.id !== recipientId));
      await fetchConnections();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send request',
      );
    } finally {
      setBusy(recipientId, false);
    }
  }

  async function handleRespond(
    connection: Connection,
    status: 'accepted' | 'rejected',
  ) {
    setBusy(connection.id, true);
    try {
      await apiClient(`/api/network/connections/${connection.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success(status === 'accepted' ? 'Request accepted' : 'Request rejected');
      await fetchConnections();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update request',
      );
    } finally {
      setBusy(connection.id, false);
    }
  }

  async function handleCancel(connection: Connection) {
    setBusy(connection.id, true);
    try {
      await apiClient(`/api/network/connections/${connection.id}`, {
        method: 'DELETE',
      });
      toast.success('Request cancelled');
      await Promise.all([fetchConnections(), fetchUsers()]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to cancel request',
      );
    } finally {
      setBusy(connection.id, false);
    }
  }

  async function handleMessage(otherUserId: string) {
    try {
      const conv = await apiClient<{ id: string }>(
        '/api/messages/conversations',
        {
          method: 'POST',
          body: JSON.stringify({ recipient_id: otherUserId }),
        },
      );
      router.push(`/messages/${conv.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to open conversation',
      );
    }
  }

  const receivedPending = connections.filter(
    (c) => c.direction === 'received' && c.status === 'pending',
  );
  const sentPending = connections.filter(
    (c) => c.direction === 'sent' && c.status === 'pending',
  );
  const accepted = connections.filter((c) => c.status === 'accepted');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Network</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover people, manage requests, and stay connected
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <TabsList>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {receivedPending.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-red px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {receivedPending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4 pt-2">
          <div className="flex justify-end">
            <Select
              value={userTypeFilter}
              onValueChange={(v) => v && setUserTypeFilter(v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="job_seeker">Job Seekers</SelectItem>
                <SelectItem value="freelancer">Freelancers</SelectItem>
                <SelectItem value="employer">Employers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingUsers ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No matches found. Complete your profile with interests and skills,
                  or check back later as more people join.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {(user.full_name || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.full_name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {USER_TYPE_LABELS[user.user_type] || user.user_type}
                          </p>
                        </div>
                      </div>
                      {user.match_score > 0 && (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50">
                          {user.match_score} match{user.match_score !== 1 ? 'es' : ''}
                        </Badge>
                      )}
                    </div>

                    {user.headline && (
                      <p className="text-sm text-muted-foreground">{user.headline}</p>
                    )}

                    {user.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {user.skills.slice(0, 5).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/10">
                            {skill}
                          </Badge>
                        ))}
                        {user.skills.length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{user.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {user.location && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {user.location}
                      </p>
                    )}

                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleConnect(user.id)}
                      disabled={busyIds.has(user.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      {busyIds.has(user.id) ? 'Sending...' : 'Connect'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6 pt-2">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Received {receivedPending.length > 0 && `(${receivedPending.length})`}
            </h2>
            {loadingConnections ? (
              <Skeleton className="h-24" />
            ) : receivedPending.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No pending requests right now.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {receivedPending.map((c) => (
                  <ConnectionRow
                    key={c.id}
                    user={c.other_user}
                    note={c.message}
                    busy={busyIds.has(c.id)}
                    actions={
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleRespond(c, 'accepted')}
                          disabled={busyIds.has(c.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRespond(c, 'rejected')}
                          disabled={busyIds.has(c.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Sent {sentPending.length > 0 && `(${sentPending.length})`}
            </h2>
            {loadingConnections ? (
              <Skeleton className="h-24" />
            ) : sentPending.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  You haven&apos;t sent any pending requests.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sentPending.map((c) => (
                  <ConnectionRow
                    key={c.id}
                    user={c.other_user}
                    busy={busyIds.has(c.id)}
                    statusLabel="Pending"
                    actions={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(c)}
                        disabled={busyIds.has(c.id)}
                      >
                        Cancel
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="connections" className="space-y-3 pt-2">
          {loadingConnections ? (
            <Skeleton className="h-24" />
          ) : accepted.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No connections yet. Find people to connect with on the Discover tab.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {accepted.map((c) => (
                <ConnectionRow
                  key={c.id}
                  user={c.other_user}
                  actions={
                    <Button
                      size="sm"
                      onClick={() => handleMessage(c.other_user.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1.5" />
                      Message
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConnectionRow({
  user,
  note,
  actions,
  busy,
  statusLabel,
}: {
  user: ConnectionUser;
  note?: string | null;
  actions: React.ReactNode;
  busy?: boolean;
  statusLabel?: string;
}) {
  return (
    <Card className={busy ? 'opacity-60' : ''}>
      <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {(user.full_name || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">
                {user.full_name || 'Anonymous'}
              </p>
              {statusLabel && (
                <Badge variant="secondary" className="text-xs">
                  {statusLabel}
                </Badge>
              )}
            </div>
            {user.headline && (
              <p className="text-xs text-muted-foreground truncate">{user.headline}</p>
            )}
            {note && (
              <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
                &ldquo;{note}&rdquo;
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">{actions}</div>
      </CardContent>
    </Card>
  );
}

export default function NetworkPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red" />
        </div>
      }
    >
      <NetworkContent />
    </Suspense>
  );
}
