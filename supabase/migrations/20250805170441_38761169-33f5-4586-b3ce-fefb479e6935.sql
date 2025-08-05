-- Fix the foreign key constraint in tb_conversations to allow profile deletion
-- First, add fields to preserve agent info in conversations
ALTER TABLE tb_conversations 
ADD COLUMN IF NOT EXISTS assigned_agent_name text,
ADD COLUMN IF NOT EXISTS assigned_agent_email text;

-- Create function to sync assigned agent information
CREATE OR REPLACE FUNCTION sync_assigned_agent_info_to_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If assigned_agent_id is set, copy agent info to the conversation
  IF NEW.assigned_agent_id IS NOT NULL THEN
    SELECT name, email 
    INTO NEW.assigned_agent_name, NEW.assigned_agent_email
    FROM profiles 
    WHERE id = NEW.assigned_agent_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync assigned agent info
DROP TRIGGER IF EXISTS sync_assigned_agent_info_trigger ON tb_conversations;
CREATE TRIGGER sync_assigned_agent_info_trigger
  BEFORE INSERT OR UPDATE ON tb_conversations
  FOR EACH ROW
  EXECUTE FUNCTION sync_assigned_agent_info_to_conversation();

-- Update existing conversations with assigned agent information
UPDATE tb_conversations 
SET assigned_agent_name = p.name, assigned_agent_email = p.email
FROM profiles p
WHERE tb_conversations.assigned_agent_id = p.id 
AND tb_conversations.assigned_agent_name IS NULL;

-- Fix the foreign key constraint to allow deletion
ALTER TABLE tb_conversations 
DROP CONSTRAINT IF EXISTS tb_conversations_assigned_agent_id_fkey;

ALTER TABLE tb_conversations 
ADD CONSTRAINT tb_conversations_assigned_agent_id_fkey 
FOREIGN KEY (assigned_agent_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;