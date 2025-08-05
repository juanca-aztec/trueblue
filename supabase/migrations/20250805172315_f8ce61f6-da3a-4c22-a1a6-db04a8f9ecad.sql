-- Mark the invitation as used for the user who already registered
UPDATE public.user_invitations 
SET used = true 
WHERE email = 'szarruk@gmail.com' AND used = false;