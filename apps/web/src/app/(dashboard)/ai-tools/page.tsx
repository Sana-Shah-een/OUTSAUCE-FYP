'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

type ToolType =
  | 'bio'
  | 'resume'
  | 'cover_letter'
  | 'gig_description'
  | 'profile_summary';
type Platform = 'linkedin' | 'upwork' | 'fiverr' | 'reddit';

interface Generation {
  id: string;
  tool_type: ToolType;
  target_platform: string | null;
  output_text: string;
  created_at: string;
}

const TOOL_TYPES: { value: ToolType; label: string; description: string }[] = [
  {
    value: 'bio',
    label: 'Professional Bio',
    description: 'Generate a compelling professional biography',
  },
  {
    value: 'resume',
    label: 'Resume Summary',
    description: 'Create an optimized resume summary section',
  },
  {
    value: 'cover_letter',
    label: 'Cover Letter',
    description: 'Draft a tailored cover letter',
  },
  {
    value: 'gig_description',
    label: 'Gig Description',
    description: 'Write an attractive freelance gig description',
  },
  {
    value: 'profile_summary',
    label: 'Profile Summary',
    description: 'Optimize your platform profile summary',
  },
];

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'upwork', label: 'Upwork' },
  { value: 'fiverr', label: 'Fiverr' },
  { value: 'reddit', label: 'Reddit' },
];

export default function AiToolsPage() {
  const [selectedTool, setSelectedTool] = useState<ToolType>('bio');
  const [platform, setPlatform] = useState<Platform | ''>('');
  const [inputFields, setInputFields] = useState({
    name: '',
    title: '',
    experience: '',
    skills: '',
    tone: 'professional',
    job_title: '',
    company: '',
    additional_context: '',
  });
  const [output, setOutput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setOutput('');
    try {
      const result = await apiClient<{ output_text: string }>(
        '/api/ai-tools/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            tool_type: selectedTool,
            target_platform: platform || undefined,
            input_data: inputFields,
          }),
        },
      );
      setOutput(result.output_text);
    } catch {
      setOutput('Failed to generate. Please try again or check your usage limits.');
    } finally {
      setGenerating(false);
    }
  }

  async function fetchHistory() {
    setLoadingHistory(true);
    try {
      const data = await apiClient<{ data: Generation[] }>(
        '/api/ai-tools/history?limit=20',
      );
      setHistory(data.data);
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }

  function toggleHistory() {
    if (!showHistory) fetchHistory();
    setShowHistory(!showHistory);
  }

  function updateField(field: string, value: string) {
    setInputFields((prev) => ({ ...prev, [field]: value }));
  }

  const currentToolInfo = TOOL_TYPES.find((t) => t.value === selectedTool);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Tools</h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate optimized content for your profiles and applications
          </p>
        </div>
        <button
          onClick={toggleHistory}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {showHistory ? 'Hide History' : 'View History'}
        </button>
      </div>

      {showHistory ? (
        <div className="space-y-3">
          {loadingHistory ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-500">No generations yet.</p>
            </div>
          ) : (
            history.map((gen) => (
              <div
                key={gen.id}
                className="rounded-lg border border-gray-200 bg-white p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 capitalize">
                      {gen.tool_type.replace('_', ' ')}
                    </span>
                    {gen.target_platform && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 capitalize">
                        {gen.target_platform}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(gen.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
                  {gen.output_text}
                </p>
                <button
                  onClick={() => {
                    setOutput(gen.output_text);
                    setShowHistory(false);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-500"
                >
                  View full output
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Config */}
          <div className="space-y-5">
            {/* Tool Type Selection */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Content Type
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {TOOL_TYPES.map((tool) => (
                  <button
                    key={tool.value}
                    onClick={() => setSelectedTool(tool.value)}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      selectedTool === tool.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <p className="font-medium">{tool.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tool.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Target Platform (optional)
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPlatform('')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    platform === ''
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  General
                </button>
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      platform === p.value
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Fields */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Your Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={inputFields.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    value={inputFields.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Key Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={inputFields.skills}
                    onChange={(e) => updateField('skills', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="React, Node.js, Python"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Experience Summary
                  </label>
                  <textarea
                    value={inputFields.experience}
                    onChange={(e) => updateField('experience', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="5+ years building web applications..."
                  />
                </div>
                {(selectedTool === 'cover_letter' ||
                  selectedTool === 'gig_description') && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        {selectedTool === 'cover_letter'
                          ? 'Job Title'
                          : 'Gig Title'}
                      </label>
                      <input
                        type="text"
                        value={inputFields.job_title}
                        onChange={(e) =>
                          updateField('job_title', e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    {selectedTool === 'cover_letter' && (
                      <div>
                        <label className="text-xs font-medium text-gray-600">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={inputFields.company}
                          onChange={(e) =>
                            updateField('company', e.target.value)
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Additional Context
                  </label>
                  <textarea
                    value={inputFields.additional_context}
                    onChange={(e) =>
                      updateField('additional_context', e.target.value)
                    }
                    rows={2}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Any specific requirements or preferences..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Tone
                  </label>
                  <select
                    value={inputFields.tone}
                    onChange={(e) => updateField('tone', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="creative">Creative</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {generating
                  ? 'Generating...'
                  : `Generate ${currentToolInfo?.label}`}
              </button>
            </div>
          </div>

          {/* Right: Output */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Output</h2>
              {output && (
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="text-xs text-indigo-600 hover:text-indigo-500"
                >
                  Copy to clipboard
                </button>
              )}
            </div>
            {generating ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              </div>
            ) : output ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {output}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm text-gray-400">
                  Select a content type and fill in your details to generate
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
