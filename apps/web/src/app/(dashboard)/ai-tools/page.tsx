'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Copy, History, Sparkles, RefreshCw, CheckCircle2, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';

type ToolType =
  | 'outreach'
  | 'bio'
  | 'resume'
  | 'cover_letter'
  | 'gig_description'
  | 'profile_summary';

type Tone = 'professional' | 'casual' | 'direct';

interface CandidateProfile {
  resume_text?: string;
  target_roles?: string[];
  skills?: string[];
}

interface LeadData {
  id: string;
  title: string;
  description?: string | null;
  company?: string | null;
  outreach_message?: string | null;
}

interface GenerationHistory {
  id: string;
  tool_type: string;
  output_text: string;
  created_at: string;
}

const TOOL_TYPES: { value: ToolType; label: string; description: string }[] = [
  { value: 'outreach', label: 'Tailored Outreach Message', description: 'Personalized intro message for a lead or client' },
  { value: 'bio', label: 'Professional Bio', description: 'Compelling professional biography' },
  { value: 'resume', label: 'Resume Summary', description: 'ATS-friendly resume summary' },
  { value: 'cover_letter', label: 'Cover Letter', description: 'Draft a tailored cover letter' },
  { value: 'gig_description', label: 'Gig Description', description: 'Attractive freelance service listing' },
  { value: 'profile_summary', label: 'Profile Summary', description: 'Platform profile overview' },
];

export default function AiToolsPage() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');
  const jobDescParam = searchParams.get('jobDesc');

  const [selectedTool, setSelectedTool] = useState<ToolType>(leadId || jobDescParam ? 'outreach' : 'outreach');
  const [loadingContext, setLoadingContext] = useState(true);

  // Outreach Generator state
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [targetRoles, setTargetRoles] = useState('');
  const [skills, setSkills] = useState('');
  const [tone, setTone] = useState<Tone>('professional');

  // Generic tool state
  const [name, setName] = useState('');
  const [profTitle, setProfTitle] = useState('');
  const [expSummary, setExpSummary] = useState('');

  const [output, setOutput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // History state
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    async function loadContext() {
      setLoadingContext(true);
      try {
        // 1. Fetch user candidate profile
        const profileRes = await apiClient<CandidateProfile | null>('/api/profile').catch(() => null);
        if (profileRes) {
          setResumeText(profileRes.resume_text || '');
          setTargetRoles((profileRes.target_roles || []).join(', '));
          setSkills((profileRes.skills || []).join(', '));
          setExpSummary(profileRes.resume_text || '');
        }

        // 2. If leadId is present, fetch lead details for prefill
        if (leadId) {
          const lead = await apiClient<LeadData | null>(`/api/leads/${leadId}`).catch(() => null);
          if (lead) {
            const desc = `${lead.title}${lead.company ? ` (${lead.company})` : ''}\n\n${lead.description || ''}`;
            setJobDescription(desc.trim());
            if (lead.outreach_message) {
              setOutput(lead.outreach_message);
            }
          }
        } else if (jobDescParam) {
          // 3. If jobDesc query param (from scrape results), use it directly
          setJobDescription(jobDescParam);
        }
      } catch (err) {
        console.error('Error loading AI tools context:', err);
      } finally {
        setLoadingContext(false);
      }
    }

    loadContext();
  }, [leadId, jobDescParam]);

  async function handleGenerateOutreach() {
    setGenerating(true);
    setCopied(false);

    try {
      const parsedRoles = targetRoles
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
      const parsedSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await apiClient<{ message: string }>('/api/ai-tools/generate-outreach', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          resumeText: resumeText.trim(),
          targetRoles: parsedRoles,
          skills: parsedSkills,
          tone,
          leadId: leadId || undefined,
        }),
      });

      setOutput(res.message);
      toast.success('Outreach message generated!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate outreach message');
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateGeneric() {
    setGenerating(true);
    setOutput('');
    setCopied(false);

    try {
      const result = await apiClient<{ output_text: string }>('/api/ai-tools/generate', {
        method: 'POST',
        body: JSON.stringify({
          tool_type: selectedTool,
          input_data: {
            name,
            title: profTitle,
            skills,
            experience: expSummary,
            tone,
          },
        }),
      });
      setOutput(result.output_text);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  async function fetchHistory() {
    setLoadingHistory(true);
    try {
      const data = await apiClient<{ data: GenerationHistory[] }>('/api/ai-tools/history?limit=20');
      setHistory(data.data);
    } catch {
    } finally {
      setLoadingHistory(false);
    }
  }

  function toggleHistory() {
    if (!showHistory) fetchHistory();
    setShowHistory(!showHistory);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-red" />
            AI Content Generator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate tailored outreach messages and optimized professional copy for your job hunts and gigs.
          </p>
        </div>
        <Button variant="outline" onClick={toggleHistory}>
          <History className="h-4 w-4 mr-1.5" />
          {showHistory ? 'Hide History' : 'View History'}
        </Button>
      </div>

      {(leadId || jobDescParam) && (
        <Alert className="border-brand-red/30 bg-brand-red/5">
          <MessageSquareText className="h-4 w-4 text-brand-red" />
          <AlertDescription className="text-xs text-foreground font-medium">
            {leadId
              ? <>Generating tailored content for lead <code className="text-brand-red font-mono">{leadId.slice(0, 8)}...</code>. Job description and candidate profile have been prefilled below.</>
              : <>Job description has been prefilled from a scrape result. Candidate profile loaded from your settings.</>
            }
          </AlertDescription>
        </Alert>
      )}

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
                <p className="text-muted-foreground">No generation history found.</p>
              </CardContent>
            </Card>
          ) : (
            history.map((gen) => (
              <Card key={gen.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary/10 text-primary capitalize">
                      {gen.tool_type.replace(/_/g, ' ')}
                    </Badge>
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
                    Load into output
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            {/* Tool type selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Select Content Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {TOOL_TYPES.map((tool) => (
                  <button
                    key={tool.value}
                    onClick={() => setSelectedTool(tool.value)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                      selectedTool === tool.value
                        ? 'border-brand-red bg-brand-red/10 text-brand-red font-medium'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    <p className="font-medium">{tool.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Input Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {selectedTool === 'outreach' ? 'Outreach Context & Preferences' : 'Your Details'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedTool === 'outreach'
                    ? 'Job description and candidate profile are prefilled below. You can edit any field before generating.'
                    : 'Fill in your experience and skills to generate customized content.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {loadingContext ? (
                  <div className="space-y-3 py-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : selectedTool === 'outreach' ? (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="jobDesc" className="text-xs font-semibold">
                        Job Description / Listing (Optional)
                      </Label>
                      <Textarea
                        id="jobDesc"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={4}
                        placeholder="Paste job listing or client description here (leave empty for general outreach)..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="targetRoles" className="text-xs font-semibold">
                        Target Roles (comma-separated)
                      </Label>
                      <Input
                        id="targetRoles"
                        value={targetRoles}
                        onChange={(e) => setTargetRoles(e.target.value)}
                        placeholder="e.g. Backend Developer, AI Engineer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="skillsInput" className="text-xs font-semibold">
                        Skills & Technologies (comma-separated)
                      </Label>
                      <Input
                        id="skillsInput"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="e.g. NestJS, Python, PostgreSQL, React"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="resumeInput" className="text-xs font-semibold">
                        Resume Summary / Experience
                      </Label>
                      <Textarea
                        id="resumeInput"
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        rows={4}
                        placeholder="Key experience and background summary..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="toneSelect" className="text-xs font-semibold">
                        Message Tone
                      </Label>
                      <Select value={tone} onValueChange={(v) => v && setTone(v as Tone)}>
                        <SelectTrigger id="toneSelect">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional & Polished</SelectItem>
                          <SelectItem value="casual">Warm & Conversational</SelectItem>
                          <SelectItem value="direct">Short & Direct</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleGenerateOutreach}
                      disabled={generating}
                    >
                      {generating ? 'Generating Outreach Message...' : 'Generate Outreach Message'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="nameInput" className="text-xs">Full Name</Label>
                      <Input
                        id="nameInput"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profTitle" className="text-xs">Professional Title</Label>
                      <Input
                        id="profTitle"
                        value={profTitle}
                        onChange={(e) => setProfTitle(e.target.value)}
                        placeholder="Senior Full Stack Engineer"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="genSkills" className="text-xs">Skills (comma-separated)</Label>
                      <Input
                        id="genSkills"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="React, TypeScript, Python"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="expSum" className="text-xs font-semibold">Experience Details</Label>
                      <Textarea
                        id="expSum"
                        value={expSummary}
                        onChange={(e) => setExpSummary(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button className="w-full" onClick={handleGenerateGeneric} disabled={generating}>
                      {generating ? 'Generating...' : `Generate ${selectedTool.replace(/_/g, ' ')}`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Output Card */}
          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-brand-red" />
                  Generated Result
                </CardTitle>
                {output && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 mr-1" />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectedTool === 'outreach' ? handleGenerateOutreach : handleGenerateGeneric}
                      disabled={generating}
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5 mr-1', generating && 'animate-spin')} />
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="space-y-3 py-12">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : output ? (
                <div className="rounded-md bg-muted/50 p-4 border border-border">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {output}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Your generated outreach message or content will appear here.
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
