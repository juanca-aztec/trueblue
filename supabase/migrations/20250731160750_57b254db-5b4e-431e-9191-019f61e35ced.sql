-- Update the handle_new_user function to work with invitation tokens
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role app_role := 'agent';
  invitation_token TEXT;
BEGIN
  -- Get invitation token from user metadata
  invitation_token := NEW.raw_user_meta_data->>'invitation_token';
  
  -- If there's an invitation token, use it to get the role and mark as used
  IF invitation_token IS NOT NULL THEN
    SELECT role INTO user_role FROM public.use_invitation_token(
      invitation_token, 
      NEW.email
    );
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
$$;