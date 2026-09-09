-- Migration: Add AI Lead Scoring columns and user_profiles table

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fit_score INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fit_reasoning TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS scored_at TIMESTAMP;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS hunt_id UUID REFERENCES public.scrape_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS outreach_message TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS outreach_generated_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS outreach_tone TEXT;

ALTER TABLE public.scrape_results ADD COLUMN IF NOT EXISTS fit_score INTEGER;
ALTER TABLE public.scrape_results ADD COLUMN IF NOT EXISTS fit_reasoning TEXT;
ALTER TABLE public.scrape_results ADD COLUMN IF NOT EXISTS scored_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  resume_text TEXT,
  target_roles TEXT[],
  skills TEXT[],
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_fit_score ON public.leads(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_hunt_id ON public.leads(hunt_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own candidate profile" ON public.user_profiles;
CREATE POLICY "Users manage own candidate profile"
  ON public.user_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
