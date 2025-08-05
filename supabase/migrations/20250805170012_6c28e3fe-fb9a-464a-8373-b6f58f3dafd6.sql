-- Fix foreign key constraint to allow profile deletion
-- First, check if there are any existing foreign key constraints
ALTER TABLE tb_messages 
DROP CONSTRAINT IF EXISTS tb_messages_responded_by_agent_id_fkey;

-- Add the foreign key back with SET NULL on delete
ALTER TABLE tb_messages 
ADD CONSTRAINT tb_messages_responded_by_agent_id_fkey 
FOREIGN KEY (responded_by_agent_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;