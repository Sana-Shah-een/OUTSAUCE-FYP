'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

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
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '20' });
        if (userTypeFilter) params.set('user_type', userTypeFilter);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network</h1>
          <p className="mt-1 text-sm text-gray-600">
            Discover people with matching interests
          </p>
        </div>
        <select
          value={userTypeFilter}
          onChange={(e) => setUserTypeFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All types</option>
          <option value="job_seeker">Job Seekers</option>
          <option value="freelancer">Freelancers</option>
          <option value="employer">Employers</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">
            No matches found. Complete your profile with interests and skills.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-lg border border-gray-200 bg-white p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-700">
                      {(user.full_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.full_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userTypeLabels[user.user_type] || user.user_type}
                    </p>
                  </div>
                </div>
                {user.match_score > 0 && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    {user.match_score} match{user.match_score !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>

              {user.headline && (
                <p className="text-sm text-gray-600">{user.headline}</p>
              )}

              {user.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {user.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                    >
                      {skill}
                    </span>
                  ))}
                  {user.skills.length > 5 && (
                    <span className="text-xs text-gray-500">
                      +{user.skills.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {user.location && (
                <p className="text-xs text-gray-500">{user.location}</p>
              )}

              <button
                onClick={() => handleConnect(user.id)}
                disabled={connectedIds.has(user.id) || connectingIds.has(user.id)}
                className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {connectedIds.has(user.id)
                  ? 'Request Sent'
                  : connectingIds.has(user.id)
                    ? 'Connecting...'
                    : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
