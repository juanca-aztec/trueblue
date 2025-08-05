-- Add created_by field to profiles table to track who created each agent
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Add created_by_name and created_by_email for preservation
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_by_name text,
ADD COLUMN IF NOT EXISTS created_by_email text;

-- Update the handle_new_user function to record who invited the user
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

-- Update existing profiles to include created_by information where possible
UPDATE profiles 
SET 
  created_by = ui.invited_by,
  created_by_name = p.name,
  created_by_email = p.email
FROM user_invitations ui
LEFT JOIN profiles p ON ui.invited_by = p.id
WHERE profiles.email = ui.email 
AND ui.used = true 
AND profiles.created_by IS NULL;