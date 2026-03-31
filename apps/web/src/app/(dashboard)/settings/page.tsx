'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';

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
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
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
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and account settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            {profile?.email && (
              <div className="space-y-1">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => updateForm('full_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>User Type</Label>
                <Select value={form.user_type} onValueChange={(v) => v && updateForm('user_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job_seeker">Job Seeker</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="employer">Employer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={form.headline}
                onChange={(e) => updateForm('headline', e.target.value)}
                placeholder="e.g. Full-Stack Developer | Open to opportunities"
              />
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => updateForm('bio', e.target.value)}
                rows={4}
                placeholder="Tell others about yourself..."
              />
            </div>

            <div className="space-y-2">
              <Label>Interests (comma-separated)</Label>
              <Input
                value={form.interests}
                onChange={(e) => updateForm('interests', e.target.value)}
                placeholder="React, Machine Learning, DevOps"
              />
            </div>

            <div className="space-y-2">
              <Label>Skills (comma-separated)</Label>
              <Input
                value={form.skills}
                onChange={(e) => updateForm('skills', e.target.value)}
                placeholder="JavaScript, TypeScript, Python, AWS"
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => updateForm('location', e.target.value)}
                placeholder="San Francisco, CA"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => updateForm('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input
                  type="url"
                  value={form.website_url}
                  onChange={(e) => updateForm('website_url', e.target.value)}
                  placeholder="https://your-website.com"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="discoverable"
                checked={form.is_discoverable}
                onCheckedChange={(checked) => updateForm('is_discoverable', checked === true)}
              />
              <Label htmlFor="discoverable" className="font-normal">
                Make my profile discoverable in the network
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Changes saved
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
