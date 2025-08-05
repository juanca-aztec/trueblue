-- CRITICAL SECURITY FIXES (Fixed version)

-- 1. Enable RLS on tb_queue_messages table (CRITICAL - currently has no protection)
ALTER TABLE public.tb_queue_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tb_queue_messages - only active users can manage queue messages
CREATE POLICY "Active users can view queue messages" 
ON public.tb_queue_messages 
FOR SELECT 
USING (is_user_active());

CREATE POLICY "Active users can insert queue messages" 
ON public.tb_queue_messages 
FOR INSERT 
WITH CHECK (is_user_active());

CREATE POLICY "Active users can update queue messages" 
ON public.tb_queue_messages 
FOR UPDATE 
USING (is_user_active());

CREATE POLICY "Active users can delete queue messages" 
ON public.tb_queue_messages 
FOR DELETE 
USING (is_user_active());

-- 2. Secure role management - prevent users from changing their own role
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;

CREATE POLICY "Users can update their own profile (except role)" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND 
  -- Prevent role changes unless user is admin
  (
    role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()) OR 
    get_current_user_role() = 'admin'::app_role
  )
);

CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (get_current_user_role() = 'admin'::app_role);

-- 3. Fix database function security by adding proper search_path settings
CREATE OR REPLACE FUNCTION public.validate_invitation_token(token_input text, email_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_invitations
    WHERE token = token_input 
    AND email = email_input 
    AND NOT used 
    AND expires_at > now()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.use_invitation_token(token_input text, email_input text)
RETURNS TABLE(role_assigned app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_status()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT status FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- 4. Create a secure function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role 
    AND status = 'active'
  );
$function$;