-- Update the handle_new_user function to work with Supabase native invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_role app_role := 'agent';
BEGIN
  -- Get role from user metadata (sent via inviteUserByEmail)
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    user_role := (NEW.raw_user_meta_data->>'role')::app_role;
  END IF;
  
  -- Insert the user profile
  INSERT INTO public.profiles (user_id, email, name, role, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    user_role,
    'active'
  );
  
  RETURN NEW;
END;
$function$;