'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  headline: string | null;
  bio: string | null;
  interests: string[];
  skills: string[];
  location: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  is_discoverable: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    user_type: 'job_seeker',
    headline: '',
    bio: '',
    interests: '',
    skills: '',
    location: '',
    linkedin_url: '',
    website_url: '',
    is_discoverable: true,
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiClient<Profile>('/api/auth/profile');
        setProfile(data);
        setForm({
          full_name: data.full_name || '',
          user_type: data.user_type || 'job_seeker',
          headline: data.headline || '',
          bio: data.bio || '',
          interests: (data.interests || []).join(', '),
          skills: (data.skills || []).join(', '),
          location: data.location || '',
          linkedin_url: data.linkedin_url || '',
          website_url: data.website_url || '',
          is_discoverable: data.is_discoverable ?? true,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        ...form,
        interests: form.interests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const data = await apiClient<Profile>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function updateForm(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your profile and account settings
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-lg border border-gray-200 bg-white p-6 space-y-5"
      >
        {profile?.email && (
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-500">{profile.email}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => updateForm('full_name', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              User Type
            </label>
            <select
              value={form.user_type}
              onChange={(e) => updateForm('user_type', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="job_seeker">Job Seeker</option>
              <option value="freelancer">Freelancer</option>
              <option value="employer">Employer</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Headline</label>
          <input
            type="text"
            value={form.headline}
            onChange={(e) => updateForm('headline', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="e.g. Full-Stack Developer | Open to opportunities"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => updateForm('bio', e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Tell others about yourself..."
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Interests (comma-separated)
          </label>
          <input
            type="text"
            value={form.interests}
            onChange={(e) => updateForm('interests', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="React, Machine Learning, DevOps"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Skills (comma-separated)
          </label>
          <input
            type="text"
            value={form.skills}
            onChange={(e) => updateForm('skills', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="JavaScript, TypeScript, Python, AWS"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => updateForm('location', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="San Francisco, CA"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={form.linkedin_url}
              onChange={(e) => updateForm('linkedin_url', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Website URL
            </label>
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => updateForm('website_url', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="https://your-website.com"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="discoverable"
            checked={form.is_discoverable}
            onChange={(e) => updateForm('is_discoverable', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="discoverable" className="text-sm text-gray-700">
            Make my profile discoverable in the network
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span className="text-sm text-green-600">
              Changes saved successfully
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
