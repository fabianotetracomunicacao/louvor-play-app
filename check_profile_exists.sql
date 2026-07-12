-- CHECAGEM DE PERFIL
-- O login funcionou, mas o app reclamou do perfil.
-- Vamos ver se existe linha na tabela public.profiles para esse usuário.

SELECT * 
FROM public.profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'login_test@teste.com');
