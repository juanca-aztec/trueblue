-- Eliminar la función problemática
DROP FUNCTION IF EXISTS public.create_agent_profile(text, text, app_role);
DROP FUNCTION IF EXISTS public.activate_agent_profile(text, uuid);