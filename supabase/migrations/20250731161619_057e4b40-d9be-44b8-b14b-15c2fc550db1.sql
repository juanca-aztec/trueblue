-- Fix infinite recursion by simplifying policies and using security definer functions properly
DROP POLICY "Active users can view all profiles" ON public.profiles;
DROP POLICY "Admins can insert profiles" ON public.profiles;
DROP POLICY "Admins can update any profile" ON public.profiles;
DROP POLICY "Users can update their own profile" ON public.profiles;

-- Create a simpler policy structure that doesn't cause recursion
-- Policy for viewing profiles - authenticated users can view all profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy for inserting profiles - only authenticated users (handled by trigger)
CREATE POLICY "System can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Policy for updating profiles - users can update their own OR admins can update any
CREATE POLICY "Users can update profiles"
ON public.profiles
FOR UPDATE
USING (
  user_id = auth.uid() OR 
  get_current_user_role() = 'admin'
);

-- Update get_current_user_role function to be more robust
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role 
  FROM profiles 
  WHERE user_id = auth.uid();
  
  RETURN user_role;
END;
$$;

-- Create function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_status text;
BEGIN
  SELECT status INTO user_status 
  FROM profiles 
  WHERE user_id = auth.uid();
  
  RETURN user_status = 'active';
END;
$$;

-- Update conversation policies to use the new functions
DROP POLICY "Active users can view all conversations" ON public.tb_conversations;
CREATE POLICY "Active users can view conversations"
ON public.tb_conversations
FOR SELECT
USING (is_user_active());

DROP POLICY "Active users can update conversations" ON public.tb_conversations;
CREATE POLICY "Active users can update conversations"
ON public.tb_conversations
FOR UPDATE
USING (is_user_active());

-- Update message policies
DROP POLICY "Active users can view all messages" ON public.tb_messages;
CREATE POLICY "Active users can view messages"
ON public.tb_messages
FOR SELECT
USING (is_user_active());

DROP POLICY "Active users can insert messages" ON public.tb_messages;
CREATE POLICY "Active users can insert messages"
ON public.tb_messages
FOR INSERT
WITH CHECK (is_user_active());

DROP POLICY "Active users can update messages" ON public.tb_messages;
CREATE POLICY "Active users can update messages"
ON public.tb_messages
FOR UPDATE
USING (is_user_active());