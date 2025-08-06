
-- Añadir columna de teléfono a la tabla tb_conversations
ALTER TABLE public.tb_conversations 
ADD COLUMN phone_number text;

-- Añadir comentario para documentar el campo
COMMENT ON COLUMN public.tb_conversations.phone_number IS 'Número de teléfono del usuario para facilitar la búsqueda';
