-- Scrape jobs
CREATE TABLE public.scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sources scrape_source[] NOT NULL,
    criteria JSONB NOT NULL DEFAULT '{}',
    status scrape_status DEFAULT 'pending',
    n8n_execution_id TEXT,
    result_count INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scrape_jobs_user ON public.scrape_jobs (user_id);
CREATE INDEX idx_scrape_jobs_status ON public.scrape_jobs (status);
CREATE INDEX idx_scrape_jobs_created ON public.scrape_jobs (created_at DESC);

CREATE TRIGGER scrape_jobs_updated_at
    BEFORE UPDATE ON public.scrape_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Scrape results (raw results from n8n)
CREATE TABLE public.scrape_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scrape_job_id UUID NOT NULL REFERENCES public.scrape_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source scrape_source NOT NULL,
    source_url TEXT,
    title TEXT NOT NULL,
    description TEXT,
    company TEXT,
    location TEXT,
    salary_range TEXT,
    salary_min INT,
    salary_max INT,
    metadata JSONB DEFAULT '{}',
    scraped_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scrape_results_job ON public.scrape_results (scrape_job_id);
CREATE INDEX idx_scrape_results_user ON public.scrape_results (user_id);
CREATE INDEX idx_scrape_results_source ON public.scrape_results (source);
