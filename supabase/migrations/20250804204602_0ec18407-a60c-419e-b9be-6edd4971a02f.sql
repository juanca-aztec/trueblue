-- First, ensure the app_role enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('admin', 'agent');
    END IF;
END $$;

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role app_role := 'agent';
  role_from_metadata text;
BEGIN
  -- Safely extract role from metadata
  role_from_metadata := NEW.raw_user_meta_data->>'role';
  
  -- Validate and set role, default to 'agent' if invalid
  IF role_from_metadata IS NOT NULL THEN
    BEGIN
      -- Try to cast to app_role, fall back to 'agent' if invalid
      user_role := role_from_metadata::app_role;
    EXCEPTION WHEN OTHERS THEN
      -- If casting fails, use default 'agent' role
      user_role := 'agent';
    END;
  END IF;
  
  -- Insert the user profile with better error handling
  BEGIN
    INSERT INTO public.profiles (user_id, email, name, role, status)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      user_role,
      'active'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    -- Still return NEW to allow user creation
  END;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();