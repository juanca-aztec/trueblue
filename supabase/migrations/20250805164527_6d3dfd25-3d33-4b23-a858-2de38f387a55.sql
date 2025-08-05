-- Add DELETE policy for profiles table
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (get_current_user_role() = 'admin'::app_role);