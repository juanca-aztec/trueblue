-- Add agent information fields to messages table for preservation
ALTER TABLE tb_messages 
ADD COLUMN IF NOT EXISTS agent_name text,
ADD COLUMN IF NOT EXISTS agent_email text;

-- Create function to sync agent information when a message is created/updated
CREATE OR REPLACE FUNCTION sync_agent_info_to_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If responded_by_agent_id is set, copy agent info to the message
  IF NEW.responded_by_agent_id IS NOT NULL THEN
    SELECT name, email 
    INTO NEW.agent_name, NEW.agent_email
    FROM profiles 
    WHERE id = NEW.responded_by_agent_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync agent info
DROP TRIGGER IF EXISTS sync_agent_info_trigger ON tb_messages;
CREATE TRIGGER sync_agent_info_trigger
  BEFORE INSERT OR UPDATE ON tb_messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_agent_info_to_message();

-- Update existing messages with agent information
UPDATE tb_messages 
SET agent_name = p.name, agent_email = p.email
FROM profiles p
WHERE tb_messages.responded_by_agent_id = p.id 
AND tb_messages.agent_name IS NULL;

-- Now we can safely allow deletion of profiles without losing agent info in messages
ALTER TABLE tb_messages 
DROP CONSTRAINT IF EXISTS tb_messages_responded_by_agent_id_fkey;

ALTER TABLE tb_messages 
ADD CONSTRAINT tb_messages_responded_by_agent_id_fkey 
FOREIGN KEY (responded_by_agent_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;