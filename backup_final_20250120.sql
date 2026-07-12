-- ============================================
-- BACKUP FINAL - 2025-12-20 01:32
-- ============================================

-- USUÁRIOS QUE FUNCIONAM
SELECT '=== TESTESEXTO (FUNCIONA) ===' as info;
SELECT * FROM auth.users WHERE email = 'testesexto@hotmail.com';
SELECT * FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');
SELECT * FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');

SELECT '=== TESTESETIMO (FUNCIONA - RECRIADO VIA SQL) ===' as info;
SELECT * FROM auth.users WHERE email = 'testesetimo@hotmail.com';
SELECT * FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesetimo@hotmail.com');
SELECT * FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'testesetimo@hotmail.com');

-- USUÁRIOS QUE NÃO FUNCIONAM (CRIADOS VIA APP)
SELECT '=== TESTE11 (NÃO FUNCIONA - ANTES DE HABILITAR TRIGGERS) ===' as info;
SELECT * FROM auth.users WHERE email = 'teste11@hotmail.com';
SELECT * FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste11@hotmail.com');
SELECT * FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'teste11@hotmail.com');

SELECT '=== TESTE12 (NÃO FUNCIONA - DEPOIS DE HABILITAR TRIGGERS) ===' as info;
SELECT * FROM auth.users WHERE email = 'teste12@hotmail.com';
SELECT * FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste12@hotmail.com');
SELECT * FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'teste12@hotmail.com');

-- ESTADO DOS TRIGGERS
SELECT '=== TRIGGERS ===' as info;
SELECT 
    tgname as trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN 'ENABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED'
        ELSE tgenabled::text
    END as status,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
  AND tgname IN ('fix_metadata_trigger', 'on_auth_user_created')
ORDER BY tgname;

-- POLICIES
SELECT '=== POLICIES ===' as info;
SELECT 
    policyname,
    cmd as command,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT'
ORDER BY policyname;
