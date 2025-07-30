-- Create enum for app roles (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'agent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add responded_by_agent_id to tb_messages if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tb_messages' AND column_name = 'responded_by_agent_id') THEN
        ALTER TABLE public.tb_messages 
        ADD COLUMN responded_by_agent_id UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- Enable RLS on existing tables
ALTER TABLE public.tb_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_agents ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all conversations" ON public.tb_conversations;
DROP POLICY IF EXISTS "Authenticated users can update conversations" ON public.tb_conversations;
DROP POLICY IF EXISTS "Authenticated users can view all messages" ON public.tb_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.tb_messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON public.tb_messages;
DROP POLICY IF EXISTS "Authenticated users can view all agents" ON public.tb_agents;
DROP POLICY IF EXISTS "Admins can manage agents" ON public.tb_agents;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_current_user_role() = 'admin');

-- RLS Policies for conversations
CREATE POLICY "Authenticated users can view all conversations" 
ON public.tb_conversations 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update conversations" 
ON public.tb_conversations 
FOR UPDATE 
TO authenticated
USING (true);

-- RLS Policies for messages  
CREATE POLICY "Authenticated users can view all messages" 
ON public.tb_messages 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert messages" 
ON public.tb_messages 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update messages" 
ON public.tb_messages 
FOR UPDATE 
TO authenticated
USING (true);

-- RLS Policies for agents
CREATE POLICY "Authenticated users can view all agents" 
ON public.tb_agents 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can manage agents" 
ON public.tb_agents 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'agent'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for conversations and messages
ALTER TABLE public.tb_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.tb_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tb_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tb_messages;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();