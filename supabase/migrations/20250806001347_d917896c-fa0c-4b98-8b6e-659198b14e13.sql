-- Eliminar la dependencia de user_id y usar profiles.id como identificador principal
-- Primero, actualizar las políticas RLS para que funcionen sin user_id

-- Actualizar políticas de profiles para que funcionen con email/id
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Nuevas políticas que no dependen de user_id
CREATE POLICY "Anyone can view active profiles" ON profiles
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.email = auth.jwt() ->> 'email'
      AND admin_profile.role = 'admin'
      AND admin_profile.status = 'active'
    )
  );

CREATE POLICY "Users can update their own profile by email" ON profiles
  FOR UPDATE USING (email = auth.jwt() ->> 'email');

-- Actualizar funciones para que trabajen con email en lugar de user_id
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT * FROM public.profiles 
  WHERE email = auth.jwt() ->> 'email' 
  AND status = 'active'
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'::app_role 
    AND status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_status text;
BEGIN
  SELECT status INTO user_status 
  FROM profiles 
  WHERE email = auth.jwt() ->> 'email';
  
  RETURN user_status = 'active';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role 
  FROM profiles 
  WHERE email = auth.jwt() ->> 'email';
  
  RETURN user_role;
END;
$function$;

-- Activar todos los perfiles pendientes para que puedan usar la aplicación
UPDATE profiles SET status = 'active' WHERE status = 'pending';