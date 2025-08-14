-- Fix Real-time Configuration
-- This migration ensures that real-time is properly configured for all tables

-- Enable realtime for all relevant tables
ALTER TABLE public.tb_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.tb_messages REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Ensure tables are added to realtime publication
DO $$
BEGIN
    -- Add tb_conversations to realtime publication if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'tb_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tb_conversations;
    END IF;

    -- Add tb_messages to realtime publication if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'tb_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tb_messages;
    END IF;

    -- Add profiles to realtime publication if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;

-- Create function to check realtime status
CREATE OR REPLACE FUNCTION public.get_realtime_enabled_tables()
RETURNS TABLE(table_name text, enabled boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::text,
        CASE WHEN t.tablename IS NOT NULL THEN true ELSE false END as enabled
    FROM pg_publication_tables t
    WHERE t.pubname = 'supabase_realtime'
    AND t.tablename IN ('tb_conversations', 'tb_messages', 'profiles');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_realtime_enabled_tables() TO authenticated;

-- Verify RLS policies are correct for real-time
-- Ensure all users can view the tables for real-time subscriptions
DROP POLICY IF EXISTS "Authenticated users can view all conversations" ON public.tb_conversations;
CREATE POLICY "Authenticated users can view all conversations" 
ON public.tb_conversations 
FOR SELECT 
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can view all messages" ON public.tb_messages;
CREATE POLICY "Authenticated users can view all messages" 
ON public.tb_messages 
FOR SELECT 
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Ensure proper triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to tb_conversations if not exists
DROP TRIGGER IF EXISTS update_tb_conversations_updated_at ON public.tb_conversations;
CREATE TRIGGER update_tb_conversations_updated_at
    BEFORE UPDATE ON public.tb_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger to tb_messages if not exists
DROP TRIGGER IF EXISTS update_tb_messages_updated_at ON public.tb_messages;
CREATE TRIGGER update_tb_messages_updated_at
    BEFORE UPDATE ON public.tb_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger to profiles if not exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Log the configuration
DO $$
BEGIN
    RAISE NOTICE 'Real-time configuration completed for: tb_conversations, tb_messages, profiles';
    RAISE NOTICE 'All tables now have REPLICA IDENTITY FULL and are in supabase_realtime publication';
END $$;





