'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface CandidateProfile {
  id?: string;
  user_id?: string;
  resume_text: string;
  target_roles: string[];
  skills: string[];
}

export default function CandidateProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    resume_text: '',
    target_roles: '',
    skills: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiClient<CandidateProfile | null>('/api/profile');
        if (data) {
          setForm({
            resume_text: data.resume_text || '',
            target_roles: (data.target_roles || []).join(', '),
            skills: (data.skills || []).join(', '),
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch candidate profile:', err);
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
    setError(null);

    try {
      const payload = {
        resume_text: form.resume_text.trim(),
        target_roles: form.target_roles
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await apiClient('/api/profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSaved(true);
      toast.success('AI match profile updated successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      const msg = err?.message || 'Failed to save candidate profile';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
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
        <Button variant="ghost" size="sm" className="mb-2" nativeButton={false} render={<Link href="/settings" />}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to settings
        </Button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-red" />
          AI Fit Scoring Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide your target roles, skills, and resume details. OutSauce uses this to score and surface the best-fit scraped leads automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matching Preferences</CardTitle>
          <CardDescription>
            Scrapes will be automatically evaluated against this profile after execution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="target_roles">Target Roles (comma-separated)</Label>
              <Input
                id="target_roles"
                value={form.target_roles}
                onChange={(e) => setForm((prev) => ({ ...prev, target_roles: e.target.value }))}
                placeholder="e.g. Backend Developer, AI/ML Engineer, Full Stack Lead"
              />
              <p className="text-xs text-muted-foreground">
                Enter the job titles or gig roles you are targeting.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills & Technologies (comma-separated)</Label>
              <Input
                id="skills"
                value={form.skills}
                onChange={(e) => setForm((prev) => ({ ...prev, skills: e.target.value }))}
                placeholder="e.g. NestJS, Python, LangChain, PostgreSQL, React, AWS"
              />
              <p className="text-xs text-muted-foreground">
                List key frameworks, languages, tools, and expertise.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume_text">Resume / Work Summary</Label>
              <Textarea
                id="resume_text"
                value={form.resume_text}
                onChange={(e) => setForm((prev) => ({ ...prev, resume_text: e.target.value }))}
                rows={8}
                placeholder="Paste your resume, bio, or work summary here..."
              />
              <p className="text-xs text-muted-foreground">
                Include work experience, domain experience, and key accomplishments.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving Profile...' : 'Save Profile'}
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Saved successfully
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
