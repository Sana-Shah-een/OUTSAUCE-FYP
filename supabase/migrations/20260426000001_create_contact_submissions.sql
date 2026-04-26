-- Create table for contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' -- pending, sent, error
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public contact form)
CREATE POLICY "Allow public inserts to contact_submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Only admins/service role can view
CREATE POLICY "Allow authenticated users to view contact_submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (auth.role() = 'authenticated');
