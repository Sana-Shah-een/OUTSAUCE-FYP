'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

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
  const [experienceLevel, setExperienceLevel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
            ...(experienceLevel && { experience_level: experienceLevel }),
          },
        }),
      });

      router.push(`/scrapes/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scrape');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Scrape Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. React jobs Bay Area"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Sources */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sources
        </label>
        <div className="flex flex-wrap gap-3">
          {SOURCES.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => toggleSource(source.id)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                sources.includes(source.id)
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {source.label}
            </button>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Keywords
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="react, senior, remote (comma separated)"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Separate multiple keywords with commas
        </p>
      </div>

      {/* Location + Remote */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. San Francisco, CA"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Remote only</span>
          </label>
        </div>
      </div>

      {/* Salary range */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Min Salary
          </label>
          <input
            type="number"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="e.g. 80000"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Max Salary
          </label>
          <input
            type="number"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder="e.g. 150000"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Experience Level
        </label>
        <select
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Any</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead / Principal</option>
          <option value="executive">Executive</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Starting scrape...' : 'Start Scrape'}
      </button>
    </form>
  );
}
