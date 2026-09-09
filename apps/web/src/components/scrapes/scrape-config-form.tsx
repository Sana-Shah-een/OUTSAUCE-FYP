'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const SOURCES = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'upwork', label: 'Upwork' },
  { id: 'fiverr', label: 'Fiverr' },
  { id: 'reddit', label: 'Reddit' },
] as const;

export function ScrapeConfigForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState(false);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('any');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkProfile() {
      try {
        const data = await apiClient<{ resume_text?: string; skills?: string[] } | null>('/api/profile');
        const isConfigured = Boolean(data && (data.resume_text || (data.skills && data.skills.length > 0)));
        setHasProfile(isConfigured);
      } catch {
        setHasProfile(false);
      }
    }
    checkProfile();
  }, []);

  function toggleSource(source: string) {
    setSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (sources.length === 0) {
      setError('Select at least one source');
      return;
    }

    const keywordList = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (keywordList.length === 0) {
      setError('Enter at least one keyword');
      return;
    }

    setLoading(true);

    try {
      const job = await apiClient<{ id: string }>('/api/scrapes', {
        method: 'POST',
        body: JSON.stringify({
          name,
          sources,
          criteria: {
            keywords: keywordList,
            ...(location && { location }),
            ...(remote && { remote }),
            ...(salaryMin && { salary_min: parseInt(salaryMin) }),
            ...(salaryMax && { salary_max: parseInt(salaryMax) }),
            ...(experienceLevel && experienceLevel !== 'any' && { experience_level: experienceLevel }),
          },
        }),
      });

      router.push(`/hunts/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create hunt');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {hasProfile === false && (
        <Alert className="border-brand-red/30 bg-brand-red/5">
          <Sparkles className="h-4 w-4 text-brand-red" />
          <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Add your candidate profile to enable AI match scoring for scraped leads.</span>
            <Link href="/settings/profile" className="font-semibold text-brand-red hover:underline ml-2">
              Set profile &rarr;
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Hunt Name</Label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. React jobs Bay Area"
        />
      </div>

      <div className="space-y-2">
        <Label>Sources</Label>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((source) => (
            <Button
              key={source.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleSource(source.id)}
              className={cn(
                sources.includes(source.id) &&
                  'border-primary bg-primary/10 text-primary'
              )}
            >
              {source.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Keywords</Label>
        <Input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="react, senior, remote (comma separated)"
        />
        <p className="text-xs text-muted-foreground">
          Separate multiple keywords with commas
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. San Francisco, CA"
          />
        </div>
        <div className="flex items-end pb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remote"
              checked={remote}
              onCheckedChange={(checked) => setRemote(checked === true)}
            />
            <Label htmlFor="remote" className="font-normal">Remote only</Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Min Salary</Label>
          <Input
            type="number"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="e.g. 80000"
          />
        </div>
        <div className="space-y-2">
          <Label>Max Salary</Label>
          <Input
            type="number"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder="e.g. 150000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Experience Level</Label>
        <Select value={experienceLevel} onValueChange={(v) => v && setExperienceLevel(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="entry">Entry Level</SelectItem>
            <SelectItem value="mid">Mid Level</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
            <SelectItem value="lead">Lead / Principal</SelectItem>
            <SelectItem value="executive">Executive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Starting hunt...' : 'Start Hunt'}
      </Button>
    </form>
  );
}
