-- Subscriptions
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    plan plan_tier DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_stripe ON public.subscriptions (stripe_customer_id);

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Usage tracking per billing period
CREATE TABLE public.usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    leads_used INT DEFAULT 0,
    scrapes_used INT DEFAULT 0,
    ai_generations_used INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, period_start)
);

CREATE INDEX idx_usage_user_period ON public.usage (user_id, period_start DESC);

CREATE TRIGGER usage_updated_at
    BEFORE UPDATE ON public.usage
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- AI generation history
CREATE TABLE public.ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tool_type ai_tool_type NOT NULL,
    target_platform scrape_source,
    input_data JSONB NOT NULL DEFAULT '{}',
    output_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_generations_user ON public.ai_generations (user_id, created_at DESC);

-- Auto-create subscription + usage on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan)
    VALUES (NEW.id, 'free');

    INSERT INTO public.usage (user_id, period_start, period_end)
    VALUES (
        NEW.id,
        date_trunc('month', now()),
        date_trunc('month', now()) + INTERVAL '1 month'
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();
