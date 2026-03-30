-- Folders for organizing leads
CREATE TABLE public.lead_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, name)
);

CREATE INDEX idx_lead_folders_user ON public.lead_folders (user_id);

-- Tags
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, name)
);

CREATE INDEX idx_tags_user ON public.tags (user_id);

-- Leads (saved scrape results)
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scrape_result_id UUID REFERENCES public.scrape_results(id) ON DELETE SET NULL,
    folder_id UUID REFERENCES public.lead_folders(id) ON DELETE SET NULL,
    source scrape_source,
    source_url TEXT,
    title TEXT NOT NULL,
    description TEXT,
    company TEXT,
    location TEXT,
    salary_range TEXT,
    salary_min INT,
    salary_max INT,
    status lead_status DEFAULT 'new',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_user ON public.leads (user_id);
CREATE INDEX idx_leads_folder ON public.leads (folder_id);
CREATE INDEX idx_leads_status ON public.leads (status);
CREATE INDEX idx_leads_created ON public.leads (created_at DESC);

CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Lead-tag junction
CREATE TABLE public.lead_tags (
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (lead_id, tag_id)
);

CREATE INDEX idx_lead_tags_tag ON public.lead_tags (tag_id);
