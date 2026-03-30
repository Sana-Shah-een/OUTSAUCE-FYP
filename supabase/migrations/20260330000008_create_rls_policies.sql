-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- ========================
-- PROFILES
-- ========================
CREATE POLICY "Discoverable profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (is_discoverable = true OR id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ========================
-- SCRAPE JOBS
-- ========================
CREATE POLICY "Users can view own scrape jobs"
    ON public.scrape_jobs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own scrape jobs"
    ON public.scrape_jobs FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scrape jobs"
    ON public.scrape_jobs FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- ========================
-- SCRAPE RESULTS
-- ========================
CREATE POLICY "Users can view own scrape results"
    ON public.scrape_results FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ========================
-- LEAD FOLDERS
-- ========================
CREATE POLICY "Users manage own folders"
    ON public.lead_folders FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ========================
-- TAGS
-- ========================
CREATE POLICY "Users manage own tags"
    ON public.tags FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ========================
-- LEADS
-- ========================
CREATE POLICY "Users manage own leads"
    ON public.leads FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ========================
-- LEAD TAGS
-- ========================
CREATE POLICY "Users manage own lead tags"
    ON public.lead_tags FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = lead_tags.lead_id AND leads.user_id = auth.uid()
        )
    );

-- ========================
-- CONNECTIONS
-- ========================
CREATE POLICY "Users can view their connections"
    ON public.connections FOR SELECT
    TO authenticated
    USING (requester_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Authenticated users can create connection requests"
    ON public.connections FOR INSERT
    TO authenticated
    WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Recipients can update connection status"
    ON public.connections FOR UPDATE
    TO authenticated
    USING (recipient_id = auth.uid());

-- ========================
-- CONVERSATIONS & MESSAGES
-- ========================
CREATE POLICY "Participants can view conversations"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = conversations.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can view participant list"
    ON public.conversation_participants FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can view messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can send messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
        )
    );

-- ========================
-- SUBSCRIPTIONS & USAGE
-- ========================
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can view own usage"
    ON public.usage FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ========================
-- AI GENERATIONS
-- ========================
CREATE POLICY "Users can view own generations"
    ON public.ai_generations FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own generations"
    ON public.ai_generations FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
