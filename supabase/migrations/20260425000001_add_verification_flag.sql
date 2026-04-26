-- Add is_verified column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Update existing profiles based on auth.users data (backfill)
UPDATE public.profiles p
SET is_verified = (u.email_confirmed_at IS NOT NULL)
FROM auth.users u
WHERE p.id = u.id;

-- Function to sync verification status from auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.sync_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET is_verified = (NEW.email_confirmed_at IS NOT NULL)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync on update to auth.users (specifically when email_confirmed_at changes)
DROP TRIGGER IF EXISTS on_auth_user_verification_update ON auth.users;
CREATE TRIGGER on_auth_user_verification_update
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_verification_status();

-- Ensure new users also get the correct initial status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, is_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        NEW.raw_user_meta_data ->> 'avatar_url',
        (NEW.email_confirmed_at IS NOT NULL)
    );
    RETURN NEW;
END;
$$;
