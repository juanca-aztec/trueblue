-- Fix infinite recursion in policies by using get_current_user_role function
DROP POLICY "Active users can view all profiles" ON public.profiles;
CREATE POLICY "Active users can view all profiles"
ON public.profiles
FOR SELECT
USING (
  (SELECT status FROM public.profiles WHERE user_id = auth.uid()) = 'active'
);

-- Fix other policies to avoid recursion
DROP POLICY "Active users can view all conversations" ON public.tb_conversations;
CREATE POLICY "Active users can view all conversations"
ON public.tb_conversations
FOR SELECT
USING (
  get_current_user_role() IS NOT NULL AND
  (SELECT status FROM public.profiles WHERE user_id = auth.uid()) = 'active'
);

DROP POLICY "Active users can update conversations" ON public.tb_conversations;
CREATE POLICY "Active users can update conversations"
ON public.tb_conversations
FOR UPDATE
USING (
  get_current_user_role() IS NOT NULL AND
  (SELECT status FROM public.profiles WHERE user_id = auth.uid()) = 'active'
);

DROP POLICY "Active users can view all messages" ON public.tb_messages;
CREATE POLICY "Active users can view all messages"
ON public.tb_messages
FOR SELECT
USING (
  get_current_user_role() IS NOT NULL AND
  (SELECT status FROM public.profiles WHERE user_id = auth.uid()) = 'active'
);

DROP POLICY "Active users can insert messages" ON public.tb_messages;
CREATE POLICY "Active users can insert messages"
ON public.tb_messages
FOR INSERT
WITH CHECK (
  get_current_user_role() IS NOT NULL AND
  (SELECT status FROM public.profiles WHERE user_id = auth.uid()) = 'active'
);

DROP POLICY "Active users can update messages" ON public.tb_messages;
CREATE POLICY "Active users can update messages"
ON public.tb_messages
FOR UPDATE
USING (
  get_current_user_role() IS NOT NULL AND
  (SELECT status FROM public.profiles WHERE user_id = auth.uid()) = 'active'
);

-- Update function to get current user status safely
CREATE OR REPLACE FUNCTION public.get_current_user_status()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT status FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create trigger to add handle_new_user to auth.users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;