-- VERIFICAÇÃO DE PERFIL E POLÍTICAS
-- 1. O perfil existe mesmo? (Sem RLS, como Admin)
SELECT * FROM public.profiles WHERE email = 'testesegundo@hotmail.com.br';

-- 2. Quais políticas protegem essa tabela?
SELECT policyname, cmd, roles, qual, permissive 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. O RLS está habilitado?
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';
