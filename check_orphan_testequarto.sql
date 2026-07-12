-- INVESTIGAÇÃO URGENTE: Testequarto
-- Vamos ver se ele existe no Limbo (Auth sem Profile) ou se nem foi criado.

SELECT 'Auth' as origem, id, email, created_at 
FROM auth.users 
WHERE email = 'testequarto@hotmail.com'

UNION ALL

SELECT 'Profile' as origem, id, email, created_at 
FROM public.profiles 
WHERE email = 'testequarto@hotmail.com';
