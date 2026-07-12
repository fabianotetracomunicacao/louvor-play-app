-- BACKUP COMPLETO - Estado atual dos usuários de teste
-- Data: 2025-12-20

-- ============================================
-- USUÁRIOS QUE FUNCIONAM
-- ============================================

-- testesexto@hotmail.com (FUNCIONA)
SELECT 'TESTESEXTO - USER' as tipo;
SELECT * FROM auth.users WHERE email = 'testesexto@hotmail.com';

SELECT 'TESTESEXTO - IDENTITY' as tipo;
SELECT * FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');

SELECT 'TESTESEXTO - PROFILE' as tipo;
SELECT * FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');

-- testesetimo@hotmail.com (FUNCIONA - recriado via SQL)
SELECT 'TESTESETIMO - USER' as tipo;
SELECT * FROM auth.users WHERE email = 'testesetimo@hotmail.com';

SELECT 'TESTESETIMO - IDENTITY' as tipo;
SELECT * FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesetimo@hotmail.com');

SELECT 'TESTESETIMO - PROFILE' as tipo;
SELECT * FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'testesetimo@hotmail.com');

-- ============================================
-- USUÁRIO QUE NÃO FUNCIONA
-- ============================================

-- testeoitavo@hotmail.com (NÃO FUNCIONA - criado via frontend)
SELECT 'TESTEOITAVO - USER' as tipo;
SELECT * FROM auth.users WHERE email = 'testeoitavo@hotmail.com';

SELECT 'TESTEOITAVO - IDENTITY' as tipo;
SELECT * FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testeoitavo@hotmail.com');

SELECT 'TESTEOITAVO - PROFILE' as tipo;
SELECT * FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'testeoitavo@hotmail.com');

-- ============================================
-- COMPARAÇÃO DETALHADA
-- ============================================

SELECT 'COMPARAÇÃO - raw_user_meta_data' as tipo;
SELECT 
    email,
    raw_user_meta_data,
    raw_app_meta_data
FROM auth.users 
WHERE email IN ('testesexto@hotmail.com', 'testesetimo@hotmail.com', 'testeoitavo@hotmail.com')
ORDER BY email;

SELECT 'COMPARAÇÃO - identity_data' as tipo;
SELECT 
    u.email,
    i.provider,
    i.provider_id,
    i.identity_data
FROM auth.identities i
JOIN auth.users u ON u.id = i.user_id
WHERE u.email IN ('testesexto@hotmail.com', 'testesetimo@hotmail.com', 'testeoitavo@hotmail.com')
ORDER BY u.email;

SELECT 'COMPARAÇÃO - senhas' as tipo;
SELECT 
    email,
    (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_123456_ok,
    substring(encrypted_password, 1, 20) as hash_prefix
FROM auth.users 
WHERE email IN ('testesexto@hotmail.com', 'testesetimo@hotmail.com', 'testeoitavo@hotmail.com')
ORDER BY email;
