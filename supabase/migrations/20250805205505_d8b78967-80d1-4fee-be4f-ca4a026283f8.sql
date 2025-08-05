-- Remove user invitations table and related functions
DROP TABLE IF EXISTS public.user_invitations CASCADE;

-- Remove invitation-related functions
DROP FUNCTION IF EXISTS public.validate_invitation_token(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.use_invitation_token(text, text) CASCADE;

-- Update profiles table to ensure it can handle pending users
-- (This should already be fine, but let's make sure)
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- Add index for faster email lookups when linking users
CREATE INDEX IF NOT EXISTS idx_profiles_email_pending 
ON public.profiles(email) 
WHERE user_id IS NULL;