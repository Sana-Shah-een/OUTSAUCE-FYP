'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { EtherealDust } from '@/components/EtherealDust';
import { OutsauceLogo } from '@/components/OutsauceLogo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import {
  User,
  Briefcase,
  Sparkles,
  Link2,
  ChevronRight,
  ChevronLeft,
  Check,
  Rocket,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Welcome',   icon: User },
  { id: 2, label: 'About You', icon: Briefcase },
  { id: 3, label: 'Expertise', icon: Sparkles },
  { id: 4, label: 'Finish Up', icon: Link2 },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    user_type: 'job_seeker',
    headline: '',
    bio: '',
    location: '',
    interests: '',
    skills: '',
    linkedin_url: '',
    website_url: '',
    is_discoverable: true,
  });

  useEffect(() => { setMounted(true); }, []);

  const isLight = theme === 'light';

  function update(field: string, value: string | boolean) {
    setError(null);
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function goNext() {
    setDirection(1);
    setStep(s => Math.min(s + 1, STEPS.length));
  }

  function goBack() {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 1));
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        interests: form.interests.split(',').map(s => s.trim()).filter(Boolean),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      };
      await apiClient('/api/auth/profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const tagList = (raw: string) =>
    raw.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden selection:bg-brand-red/30">
      {mounted && <EtherealDust isLightMode={isLight} />}

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <OutsauceLogo className="h-10 w-auto" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center py-24 px-4">

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8 relative z-10"
        >
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive   = step === s.id;
            const isDone     = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300 ${
                  isDone
                    ? 'bg-brand-red border-brand-red text-white'
                    : isActive
                    ? 'border-brand-red text-brand-red bg-brand-red/10'
                    : 'border-white/20 dark:border-white/10 text-text-muted'
                }`}>
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`hidden sm:inline text-xs font-semibold transition-colors duration-300 ${
                  isActive ? 'text-brand-red' : isDone ? 'text-text-muted' : 'text-text-muted/50'
                }`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px mx-1 transition-colors duration-500 ${
                    isDone ? 'bg-brand-red' : 'bg-white/10 dark:bg-white/10'
                  }`} />
                )}
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg relative z-10"
        >
          <div className="relative overflow-hidden rounded-[32px] p-8 sm:p-10 bg-white/95 dark:bg-[#020617]/80 border-2 border-brand-red/40 dark:border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-[24px]">
            <div className="absolute inset-0 rounded-[32px] pointer-events-none ring-1 ring-inset ring-white/10 dark:ring-white/5" />

            <div className="relative z-10 min-h-[340px] flex flex-col">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className="flex-1 flex flex-col"
                >
                  {step === 1 && (
                    <div className="flex flex-col gap-5">
                      <div>
                        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                          Welcome to Outsauce 👋
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Let's set up your profile in just a few quick steps.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Your Full Name</Label>
                        <Input
                          id="full_name"
                          value={form.full_name}
                          onChange={e => update('full_name', e.target.value)}
                          placeholder="e.g. Ramsha Anwar"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user_type">I am a...</Label>
                        <Select value={form.user_type} onValueChange={v => v && update('user_type', v)}>
                          <SelectTrigger id="user_type" className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="job_seeker">🎯 Job Seeker</SelectItem>
                            <SelectItem value="freelancer">💼 Freelancer</SelectItem>
                            <SelectItem value="employer">🏢 Employer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="flex flex-col gap-5">
                      <div>
                        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                          About You
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          A strong profile helps you stand out to employers and collaborators.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="headline">Professional Headline</Label>
                        <Input
                          id="headline"
                          value={form.headline}
                          onChange={e => update('headline', e.target.value)}
                          placeholder="e.g. Full-Stack Developer | Open to Opportunities"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Short Bio</Label>
                        <Textarea
                          id="bio"
                          value={form.bio}
                          onChange={e => update('bio', e.target.value)}
                          placeholder="Tell others what you do and what you're looking for..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={form.location}
                          onChange={e => update('location', e.target.value)}
                          placeholder="e.g. Lahore, Pakistan"
                          className="h-11"
                        />
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="flex flex-col gap-5">
                      <div>
                        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                          Your Expertise
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Add your skills and interests — separate them with commas.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="skills">Skills</Label>
                        <Input
                          id="skills"
                          value={form.skills}
                          onChange={e => update('skills', e.target.value)}
                          placeholder="e.g. React, TypeScript, Node.js, AWS"
                          className="h-11"
                        />
                        {tagList(form.skills).length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {tagList(form.skills).map(tag => (
                              <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-red/10 text-brand-red border border-brand-red/20">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interests">Interests</Label>
                        <Input
                          id="interests"
                          value={form.interests}
                          onChange={e => update('interests', e.target.value)}
                          placeholder="e.g. Machine Learning, Open Source, Startups"
                          className="h-11"
                        />
                        {tagList(form.interests).length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {tagList(form.interests).map(tag => (
                              <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 dark:bg-white/5 text-muted-foreground border border-white/10">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="flex flex-col gap-5">
                      <div>
                        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                          Almost there! 🚀
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Add your online presence and choose your visibility setting.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin_url">LinkedIn URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Input
                          id="linkedin_url"
                          type="url"
                          value={form.linkedin_url}
                          onChange={e => update('linkedin_url', e.target.value)}
                          placeholder="https://linkedin.com/in/yourname"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website_url">Website / Portfolio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Input
                          id="website_url"
                          type="url"
                          value={form.website_url}
                          onChange={e => update('website_url', e.target.value)}
                          placeholder="https://your-portfolio.com"
                          className="h-11"
                        />
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-red/5 border border-brand-red/15">
                        <Checkbox
                          id="discoverable"
                          checked={form.is_discoverable}
                          onCheckedChange={v => update('is_discoverable', v === true)}
                          className="mt-0.5"
                        />
                        <div>
                          <Label htmlFor="discoverable" className="font-semibold cursor-pointer">
                            Make my profile discoverable
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Let other users find you in the Network. You can change this anytime in Settings.
                          </p>
                        </div>
                      </div>
                      {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-black/[0.06] dark:border-white/[0.06]">
                <Button
                  variant="ghost"
                  onClick={goBack}
                  disabled={step === 1}
                  className="gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                <span className="text-xs text-muted-foreground font-medium">
                  Step {step} of {STEPS.length}
                </span>

                {step < STEPS.length ? (
                  <Button
                    onClick={goNext}
                    className="gap-1 bg-brand-red hover:bg-brand-red/90 text-white hover:scale-105 transition-all duration-200"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinish}
                    disabled={saving}
                    className="gap-2 bg-brand-red hover:bg-brand-red/90 text-white hover:scale-105 transition-all duration-200"
                  >
                    {saving ? 'Saving...' : (
                      <>
                        <Rocket className="h-4 w-4" />
                        Launch Dashboard
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <p className="mt-6 text-xs text-muted-foreground relative z-10">
          All fields except your name are optional — you can always update them in Settings.
        </p>
      </main>
    </div>
  );
}
