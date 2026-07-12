-- PASSO 3: Dados de public.profiles para testesexto

SELECT * FROM public.profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');
