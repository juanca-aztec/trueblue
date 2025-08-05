-- Hacer que user_id sea nullable temporalmente para perfiles pendientes
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Agregar un índice único en email para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON public.profiles(email);

-- Actualizar RLS para permitir que los admins vean perfiles sin user_id
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Actualizar RLS para inserción de perfiles pendientes por admins
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (get_current_user_role() = 'admin'::app_role OR user_id = auth.uid());