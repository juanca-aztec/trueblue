-- Fix foreign key constraint - tb_conversations should reference profiles, not tb_agents
ALTER TABLE tb_conversations DROP CONSTRAINT IF EXISTS tb_conversations_assigned_agent_id_fkey;

-- Add correct foreign key to profiles table
ALTER TABLE tb_conversations 
ADD CONSTRAINT tb_conversations_assigned_agent_id_fkey 
FOREIGN KEY (assigned_agent_id) REFERENCES profiles(id);