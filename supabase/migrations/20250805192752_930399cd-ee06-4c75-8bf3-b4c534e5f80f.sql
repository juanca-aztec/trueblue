-- Actualizar el perfil del agente que no tiene user_id asignado
UPDATE profiles 
SET user_id = '48c2daa6-099f-4c41-9932-a765ea540f01'
WHERE email = 'jc.acero01@outlook.com' AND user_id IS NULL;