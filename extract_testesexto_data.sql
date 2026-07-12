-- EXTRAIR DADOS COMPLETOS: testesexto@hotmail.com
-- Capturar TODOS os campos exatamente como o App criou.

-- 1. Dados completos de auth.users
SELECT 
    '=== AUTH.USERS ===' as secao;
    
SELECT 
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password as password_hash_preview,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    confirmed_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
FROM auth.users
WHERE email = 'testesexto@hotmail.com';

-- 2. Dados completos de auth.identities
SELECT 
    '=== AUTH.IDENTITIES ===' as secao;

SELECT 
    provider_id,
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    email
FROM auth.identities
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');

-- 3. Dados de public.profiles
SELECT 
    '=== PUBLIC.PROFILES ===' as secao;

SELECT *
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'testesexto@hotmail.com');
