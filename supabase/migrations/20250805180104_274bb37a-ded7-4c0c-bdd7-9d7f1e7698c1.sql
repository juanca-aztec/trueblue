-- First, check if app_role enum exists and recreate it if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('admin', 'agent');
    END IF;
END $$;

-- Ensure conversation_status enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status') THEN
        CREATE TYPE conversation_status AS ENUM ('active_ai', 'active_human', 'pending', 'closed');
    END IF;
END $$;

-- Ensure message_sender_role enum exists  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_sender_role') THEN
        CREATE TYPE message_sender_role AS ENUM ('user', 'agent', 'ai', 'system');
    END IF;
END $$;

-- Create missing trigger for handle_new_user if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update the handle_new_user function to be more robust
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
  LEFT JOIN public.profiles p ON ui.invited_by = p.user_id
  WHERE ui.email = NEW.email AND ui.used = false
  ORDER BY ui.created_at DESC
  LIMIT 1;
  
  -- Insert profile for new user
  INSERT INTO public.profiles (user_id, email, name, role, status, created_by, created_by_name, created_by_email)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(invitation_record.role::app_role, 'agent'::app_role),
    'active',
    invitation_record.invited_by,
    invitation_record.inviter_name,
    invitation_record.inviter_email
  );
  
  -- Mark invitation as used if it exists
  IF invitation_record.id IS NOT NULL THEN
    UPDATE public.user_invitations 
    SET used = true 
    WHERE id = invitation_record.id;
  END IF;
  
  RETURN NEW;
END;
$$;