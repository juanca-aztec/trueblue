-- Agregar columna channel a tb_conversations
ALTER TABLE public.tb_conversations 
ADD COLUMN channel text DEFAULT 'telegram';

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.tb_conversations.channel IS 'Canal de origen de la conversación (telegram, whatsapp, etc.)';

-- Actualizar conversaciones existentes
UPDATE public.tb_conversations 
SET channel = 'telegram' 
WHERE channel IS NULL;

