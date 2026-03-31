'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Copy, History } from 'lucide-react';

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
  { value: 'bio', label: 'Professional Bio', description: 'Generate a compelling professional biography' },
  { value: 'resume', label: 'Resume Summary', description: 'Create an optimized resume summary section' },
  { value: 'cover_letter', label: 'Cover Letter', description: 'Draft a tailored cover letter' },
  { value: 'gig_description', label: 'Gig Description', description: 'Write an attractive freelance gig description' },
  { value: 'profile_summary', label: 'Profile Summary', description: 'Optimize your platform profile summary' },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate optimized content for your profiles and applications
          </p>
        </div>
        <Button variant="outline" onClick={toggleHistory}>
          <History className="h-4 w-4 mr-1.5" />
          {showHistory ? 'Hide History' : 'View History'}
        </Button>
      </div>

      {showHistory ? (
        <div className="space-y-3">
          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No generations yet.</p>
              </CardContent>
            </Card>
          ) : (
            history.map((gen) => (
              <Card key={gen.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 capitalize">
                        {gen.tool_type.replace('_', ' ')}
                      </Badge>
                      {gen.target_platform && (
                        <Badge variant="secondary" className="capitalize">
                          {gen.target_platform}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(gen.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                    {gen.output_text}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => {
                      setOutput(gen.output_text);
                      setShowHistory(false);
                    }}
                  >
                    View full output
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Config */}
          <div className="space-y-5">
            {/* Tool Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Content Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {TOOL_TYPES.map((tool) => (
                  <button
                    key={tool.value}
                    onClick={() => setSelectedTool(tool.value)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                      selectedTool === tool.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <p className="font-medium">{tool.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tool.description}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Platform */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Target Platform (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={platform === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlatform('')}
                  >
                    General
                  </Button>
                  {PLATFORMS.map((p) => (
                    <Button
                      key={p.value}
                      variant={platform === p.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPlatform(p.value)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Input Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    value={inputFields.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Professional Title</Label>
                  <Input
                    value={inputFields.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Senior Software Engineer"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Key Skills (comma-separated)</Label>
                  <Input
                    value={inputFields.skills}
                    onChange={(e) => updateField('skills', e.target.value)}
                    placeholder="React, Node.js, Python"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Experience Summary</Label>
                  <Textarea
                    value={inputFields.experience}
                    onChange={(e) => updateField('experience', e.target.value)}
                    rows={3}
                    placeholder="5+ years building web applications..."
                  />
                </div>
                {(selectedTool === 'cover_letter' || selectedTool === 'gig_description') && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        {selectedTool === 'cover_letter' ? 'Job Title' : 'Gig Title'}
                      </Label>
                      <Input
                        value={inputFields.job_title}
                        onChange={(e) => updateField('job_title', e.target.value)}
                      />
                    </div>
                    {selectedTool === 'cover_letter' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Company Name</Label>
                        <Input
                          value={inputFields.company}
                          onChange={(e) => updateField('company', e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Additional Context</Label>
                  <Textarea
                    value={inputFields.additional_context}
                    onChange={(e) => updateField('additional_context', e.target.value)}
                    rows={2}
                    placeholder="Any specific requirements or preferences..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tone</Label>
                  <Select value={inputFields.tone} onValueChange={(v) => v && updateField('tone', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Generating...' : `Generate ${currentToolInfo?.label}`}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Output */}
          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Output</CardTitle>
                {output && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(output)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="space-y-2 py-12">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : output ? (
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {output}
                </p>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <p className="text-sm text-muted-foreground text-center">
                    Select a content type and fill in your details to generate
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
