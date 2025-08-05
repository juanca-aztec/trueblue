-- Eliminar la restricción actual del status
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_status;

-- Agregar una nueva restricción que incluya 'pending'
ALTER TABLE public.profiles ADD CONSTRAINT check_status 
CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text]));