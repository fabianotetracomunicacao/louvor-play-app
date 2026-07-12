-- EXTRAÇÃO COMPLETA: testesexto@hotmail.com
-- Todas as tabelas do schema auth + public.profiles

DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'testesexto@hotmail.com';
    RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- 1. auth.users
SELECT '=== 1. AUTH.USERS ===' as info;
SELECT * FROM auth.users WHERE email = 'testesexto@hotmail.com';

-- 2. auth.identities
SELECT '=== 2. AUTH.IDENTITIES ===' as info;
SELECT * FROM auth.identities 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');

-- 3. auth.sessions
SELECT '=== 3. AUTH.SESSIONS ===' as info;
SELECT * FROM auth.sessions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');

-- 4. auth.refresh_tokens
SELECT '=== 4. AUTH.REFRESH_TOKENS ===' as info;
SELECT * FROM auth.refresh_tokens 
WHERE user_id::uuid = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');

-- 5. auth.mfa_factors (se existir)
SELECT '=== 5. AUTH.MFA_FACTORS ===' as info;
SELECT * FROM auth.mfa_factors 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');

-- 6. auth.mfa_challenges (se existir)
SELECT '=== 6. AUTH.MFA_CHALLENGES ===' as info;
SELECT * FROM auth.mfa_challenges 
WHERE factor_id IN (
    SELECT id FROM auth.mfa_factors 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com')
);

-- 7. public.profiles
SELECT '=== 7. PUBLIC.PROFILES ===' as info;
SELECT * FROM public.profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');

-- 8. Comparação de SCHEMAS entre working e failing
SELECT '=== 8. COMPARAÇÃO ESTRUTURAL ===' as info;
SELECT 
    'novapessoa2' as usuario_tipo,
    count(*) FILTER (WHERE confirmation_token != '') as tem_confirmation_token,
    count(*) FILTER (WHERE recovery_token != '') as tem_recovery_token,
    count(*) FILTER (WHERE confirmation_sent_at IS NOT NULL) as tem_confirmation_sent,
    count(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as tem_email_confirmed
FROM auth.users WHERE email = 'novapessoa2@hotmail.com'
UNION ALL
SELECT 
    'testesexto',
    count(*) FILTER (WHERE confirmation_token != ''),
    count(*) FILTER (WHERE recovery_token != ''),
    count(*) FILTER (WHERE confirmation_sent_at IS NOT NULL),
    count(*) FILTER (WHERE email_confirmed_at IS NOT NULL)
FROM auth.users WHERE email = 'testesexto@hotmail.com';
