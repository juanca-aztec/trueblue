-- Recreate the trigger to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get invitation details if it exists
  SELECT ui.*, p.name as inviter_name, p.email as inviter_email
  INTO invitation_record
  FROM public.user_invitations ui
  LEFT JOIN public.profiles p ON ui.invited_by = p.id
  WHERE ui.email = NEW.email AND ui.used = false
  LIMIT 1;
  
  -- Insert profile for new user
  INSERT INTO public.profiles (user_id, email, name, role, status, created_by, created_by_name, created_by_email)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(invitation_record.role, 'agent'::app_role),
    'active',
    invitation_record.invited_by,
    invitation_record.inviter_name,
    invitation_record.inviter_email
  );
  
  -- Mark invitation as used if it exists
  UPDATE public.user_invitations 
  SET used = true 
  WHERE email = NEW.email AND used = false;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();