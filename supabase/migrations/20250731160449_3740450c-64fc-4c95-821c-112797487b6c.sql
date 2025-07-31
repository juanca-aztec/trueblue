-- Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- Add check constraint for status values
ALTER TABLE public.profiles 
ADD CONSTRAINT check_status CHECK (status IN ('active', 'inactive'));

-- Create table for user invitations
CREATE TABLE public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'agent',
  invited_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invitations table
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Admins can manage invitations"
ON public.user_invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update existing RLS policies to check for active status
DROP POLICY "Users can view all profiles" ON public.profiles;
CREATE POLICY "Active users can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Update conversations policies to check for active status
DROP POLICY "Authenticated users can view all conversations" ON public.tb_conversations;
CREATE POLICY "Active users can view all conversations"
ON public.tb_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

DROP POLICY "Authenticated users can update conversations" ON public.tb_conversations;
CREATE POLICY "Active users can update conversations"
ON public.tb_conversations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Update messages policies to check for active status
DROP POLICY "Authenticated users can view all messages" ON public.tb_messages;
CREATE POLICY "Active users can view all messages"
ON public.tb_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

DROP POLICY "Authenticated users can insert messages" ON public.tb_messages;
CREATE POLICY "Active users can insert messages"
ON public.tb_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

DROP POLICY "Authenticated users can update messages" ON public.tb_messages;
CREATE POLICY "Active users can update messages"
ON public.tb_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Update profiles policies for admin management
DROP POLICY "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);

-- Create function to validate invitation token
CREATE OR REPLACE FUNCTION public.validate_invitation_token(token_input TEXT, email_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_invitations
    WHERE token = token_input 
    AND email = email_input 
    AND NOT used 
    AND expires_at > now()
  );
END;
$$;

-- Create function to use invitation token
CREATE OR REPLACE FUNCTION public.use_invitation_token(token_input TEXT, email_input TEXT)
RETURNS TABLE(role_assigned app_role)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_role app_role;
BEGIN
  -- Get and mark invitation as used
  UPDATE public.user_invitations 
  SET used = true 
  WHERE token = token_input 
  AND email = email_input 
  AND NOT used 
  AND expires_at > now()
  RETURNING role INTO invitation_role;
  
  IF invitation_role IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  RETURN QUERY SELECT invitation_role;
END;
$$;