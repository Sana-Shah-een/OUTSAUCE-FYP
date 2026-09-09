'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button, buttonVariants } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { CheckCircle, ShieldAlert, KeyRound, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

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
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  function updateForm(field: string, value: string | boolean) {
    setError(null);
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      await apiClient('/api/auth/delete-account', { method: 'POST' });
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      setError(err.message || 'Failed to delete account');
      setIsDeleting(false);
    }
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

      <Card className="border-brand-red/30 bg-brand-red/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-red" />
              AI Fit Match Profile
            </span>
            <Link href="/settings/profile" className={buttonVariants({ variant: 'default', size: 'sm' })}>
              Manage AI Match Profile
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Set up target roles, skills, and your resume so AI automatically scores incoming job and gig leads (0-100% fit).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-brand-red" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">Password</p>
              <p className="text-sm text-muted-foreground">Change your password to keep your account secure.</p>
            </div>
            <Link href="/settings/change-password" className={buttonVariants({ variant: 'outline' })}>
              Change Password
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">Remove Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
            </div>
            <Dialog>
              <DialogTrigger className={buttonVariants({ variant: 'destructive' })}>
                Remove Account
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <DialogClose className={buttonVariants({ variant: 'outline' })}>
                    Cancel
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
