'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin } from 'lucide-react';

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

export default function NetworkPage() {
  const [users, setUsers] = useState<DiscoveredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '20' });
        if (userTypeFilter && userTypeFilter !== 'all') params.set('user_type', userTypeFilter);
        const data = await apiClient<{ data: DiscoveredUser[] }>(
          `/api/network/discover?${params.toString()}`,
        );
        setUsers(data.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [userTypeFilter]);

  async function handleConnect(recipientId: string) {
    setConnectingIds((prev) => new Set(prev).add(recipientId));
    try {
      await apiClient('/api/network/connect', {
        method: 'POST',
        body: JSON.stringify({ recipient_id: recipientId }),
      });
      setConnectedIds((prev) => new Set(prev).add(recipientId));
    } catch {
      // ignore
    } finally {
      setConnectingIds((prev) => {
        const next = new Set(prev);
        next.delete(recipientId);
        return next;
      });
    }
  }

  const userTypeLabels: Record<string, string> = {
    job_seeker: 'Job Seeker',
    freelancer: 'Freelancer',
    employer: 'Employer',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Network</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover people with matching interests
          </p>
        </div>
        <Select value={userTypeFilter} onValueChange={(v) => v && setUserTypeFilter(v)}>
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

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No matches found. Complete your profile with interests and skills.
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
                        {userTypeLabels[user.user_type] || user.user_type}
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
                  disabled={connectedIds.has(user.id) || connectingIds.has(user.id)}
                >
                  {connectedIds.has(user.id)
                    ? 'Request Sent'
                    : connectingIds.has(user.id)
                      ? 'Connecting...'
                      : 'Connect'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
