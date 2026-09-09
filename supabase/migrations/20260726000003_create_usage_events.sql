-- Plans table: defines limits per tier
CREATE TABLE public.plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly INTEGER NOT NULL,
    leads_limit INTEGER,          -- NULL = unlimited
    hunts_limit INTEGER,          -- NULL = unlimited
    ai_generations_limit INTEGER, -- NULL = unlimited
    stripe_price_id TEXT
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are readable by all authenticated users"
    ON public.plans FOR SELECT
    TO authenticated
    USING (true);

INSERT INTO public.plans (id, name, price_monthly, leads_limit, hunts_limit, ai_generations_limit, stripe_price_id) VALUES
('free', 'Free', 0, 20, 5, 10, NULL),
('starter', 'Starter', 1900, 200, 50, 100, NULL),
('pro', 'Pro', 4900, NULL, NULL, NULL, NULL),
('enterprise', 'Enterprise', 9900, NULL, NULL, NULL, NULL);

-- Add billing_cycle_start to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ DEFAULT now();

-- Usage events table: event-sourced usage tracking
CREATE TABLE public.usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('lead_created', 'hunt_created', 'ai_generation')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_usage_events_user_type_date ON public.usage_events (user_id, event_type, created_at);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage events"
    ON public.usage_events FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Service can insert usage events"
    ON public.usage_events FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Update the handle_new_profile() trigger to also set billing_cycle_start
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan, billing_cycle_start)
    VALUES (NEW.id, 'free', now());

    INSERT INTO public.usage (user_id, period_start, period_end)
    VALUES (
        NEW.id,
        date_trunc('month', now()),
        date_trunc('month', now()) + INTERVAL '1 month'
    );

    RETURN NEW;
END;
$$;