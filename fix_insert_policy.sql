-- SOLUÇÃO: Permitir que a função handle_new_user insira profiles
-- sem depender de auth.uid() (que é NULL durante signup)

-- 1. Dropar policies problemáticas
DROP POLICY IF EXISTS "Profiles Insert" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 2. Criar policy correta que permite INSERT via trigger
-- A função handle_new_user tem SECURITY DEFINER, então ela roda como owner
-- Precisamos permitir INSERT para authenticated role quando NEW.id = auth.uid()
-- OU quando auth.uid() é NULL (durante o signup via trigger)

CREATE POLICY "Allow profile creation during signup"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (
    -- Permite se for o próprio usuário OU se auth.uid() é NULL (trigger)
    auth.uid() = id OR auth.uid() IS NULL
);

-- 3. Garantir que a função tem as permissões corretas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.profiles TO anon, authenticated;

-- 4. Verificar se funcionou
SELECT 
    'NOVA POLICY' as info,
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';
