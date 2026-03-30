-- Connection requests between users
CREATE TABLE public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(requester_id, recipient_id),
    CHECK (requester_id <> recipient_id)
);

CREATE INDEX idx_connections_requester ON public.connections (requester_id);
CREATE INDEX idx_connections_recipient ON public.connections (recipient_id);
CREATE INDEX idx_connections_status ON public.connections (status);

CREATE TRIGGER connections_updated_at
    BEFORE UPDATE ON public.connections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
