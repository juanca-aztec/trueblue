-- Arreglar las políticas RLS que están causando recursión infinita
-- Eliminar las políticas problemáticas
DROP POLICY IF EXISTS "Anyone can view active profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile by email" ON profiles;

-- Crear políticas simples y seguras sin recursión
CREATE POLICY "Authenticated users can view all profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile by email" ON profiles
  FOR UPDATE USING (email = auth.jwt() ->> 'email');

-- Política especial para admins usando función segura
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'juanca@azteclab.co', 
      'salomon@azteclab.co', 
      'szarruk@gmail.com'
    )
  );

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'juanca@azteclab.co', 
      'salomon@azteclab.co', 
      'szarruk@gmail.com'
    )
  );

-- Actualizar las funciones para evitar recursión
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.jwt() ->> 'email' IN (
    'juanca@azteclab.co', 
    'salomon@azteclab.co', 
    'szarruk@gmail.com'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT true; -- Por ahora, todos los usuarios autenticados están activos
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN auth.jwt() ->> 'email' IN (
        'juanca@azteclab.co', 
        'salomon@azteclab.co', 
        'szarruk@gmail.com'
      ) THEN 'admin'::app_role
      ELSE 'agent'::app_role
    END;
$function$;