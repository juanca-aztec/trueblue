-- Remove the foreign key constraint that's causing the error
-- The created_by field should reference auth.users directly, not profiles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_created_by_fkey;

-- Add a comment to clarify that created_by references auth.users
COMMENT ON COLUMN public.profiles.created_by IS 'References auth.users.id - the user who created this profile';