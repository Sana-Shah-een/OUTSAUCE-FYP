-- Safely add missing columns to contact_submissions

ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
