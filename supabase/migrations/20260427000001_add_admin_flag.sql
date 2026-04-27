-- Add is_admin flag to profiles table
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create an index for querying admins
CREATE INDEX idx_profiles_is_admin ON public.profiles (is_admin) WHERE is_admin = true;

-- Security: Prevent users from making themselves admin via the Supabase Data API
-- We use a trigger to block updates to is_admin unless it's done by the service_role
CREATE OR REPLACE FUNCTION public.prevent_is_admin_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If the is_admin flag is being changed
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
        -- Check if the current user is an authenticated user (meaning it's not the service_role or admin)
        IF auth.role() = 'authenticated' THEN
            RAISE EXCEPTION 'Users cannot modify their own admin status';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER check_is_admin_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_is_admin_update();
