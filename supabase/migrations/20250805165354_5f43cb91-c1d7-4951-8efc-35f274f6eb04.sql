-- Create profile for szarruk@gmail.com manually
INSERT INTO public.profiles (user_id, email, name, role, status)
VALUES (
  'd9b9dcc8-6443-4fe2-885a-b77511ce39b4'::uuid,
  'szarruk@gmail.com',
  'Salomon Zarruk Gmail',
  'agent'::app_role,
  'active'
);

-- Create or replace trigger function to handle new user signup and profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (user_id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'agent'::app_role,
    'active'
  );
  
  -- Mark invitation as used if it exists
  UPDATE public.user_invitations 
  SET used = true 
  WHERE email = NEW.email AND used = false;
  
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();