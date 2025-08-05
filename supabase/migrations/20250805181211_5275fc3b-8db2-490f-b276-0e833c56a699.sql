-- Eliminar la función y trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Eliminar edge function de invitación (lo haremos más simple)
-- Crear una función más simple para crear perfiles directamente

-- Función para crear un perfil de agente directamente
CREATE OR REPLACE FUNCTION public.create_agent_profile(
  agent_email text,
  agent_name text,
  agent_role app_role DEFAULT 'agent'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_profile_id uuid;
BEGIN
  -- Insertar directamente en la tabla profiles
  INSERT INTO public.profiles (
    user_id,
    email,
    name,
    role,
    status,
    created_by,
    created_by_name,
    created_by_email
  )
  VALUES (
    gen_random_uuid(), -- Generamos un UUID temporal hasta que el usuario se registre
    agent_email,
    agent_name,
    agent_role,
    'pending', -- Estado pendiente hasta que se registren
    auth.uid(),
    (SELECT name FROM profiles WHERE user_id = auth.uid()),
    (SELECT email FROM profiles WHERE user_id = auth.uid())
  )
  RETURNING id INTO new_profile_id;

  -- Crear invitación
  INSERT INTO public.user_invitations (
    email,
    role,
    invited_by,
    token,
    expires_at
  )
  VALUES (
    agent_email,
    agent_role,
    auth.uid(),
    gen_random_uuid(),
    now() + interval '7 days'
  );

  RETURN new_profile_id;
END;
$$;

-- Función para cuando el usuario se registre con la invitación
CREATE OR REPLACE FUNCTION public.activate_agent_profile(
  invitation_token text,
  user_auth_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invitation_record record;
BEGIN
  -- Buscar la invitación válida
  SELECT * INTO invitation_record
  FROM user_invitations 
  WHERE token = invitation_token 
  AND used = false 
  AND expires_at > now();

  IF invitation_record IS NULL THEN
    RETURN false;
  END IF;

  -- Actualizar el perfil existente con el user_id real
  UPDATE profiles 
  SET 
    user_id = user_auth_id,
    status = 'active'
  WHERE email = invitation_record.email 
  AND status = 'pending';

  -- Marcar invitación como usada
  UPDATE user_invitations 
  SET used = true 
  WHERE id = invitation_record.id;

  RETURN true;
END;
$$;