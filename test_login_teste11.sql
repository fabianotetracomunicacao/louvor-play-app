-- Testar login com SELECT (para ver resultado)
WITH user_check AS (
    SELECT 
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_ok
    FROM auth.users
    WHERE email = 'teste11@hotmail.com'
),
identity_check AS (
    SELECT 
        user_id,
        provider,
        provider_id,
        identity_data
    FROM auth.identities
    WHERE user_id = (SELECT id FROM user_check)
),
profile_check AS (
    SELECT 
        id,
        email,
        role
    FROM public.profiles
    WHERE id = (SELECT id FROM user_check)
)
SELECT 
    'RESULTADO DO TESTE' as info,
    CASE 
        WHEN (SELECT id FROM user_check) IS NULL THEN '❌ Usuário não encontrado'
        WHEN NOT (SELECT senha_ok FROM user_check) THEN '❌ Senha incorreta'
        WHEN (SELECT email_confirmed_at FROM user_check) IS NULL THEN '❌ Email não confirmado'
        WHEN (SELECT user_id FROM identity_check) IS NULL THEN '❌ Identity não existe'
        WHEN (SELECT id FROM profile_check) IS NULL THEN '❌ Profile não existe'
        ELSE '✅ TUDO OK - LOGIN DEVERIA FUNCIONAR!'
    END as resultado,
    (SELECT id FROM user_check)::text as user_id,
    (SELECT senha_ok FROM user_check)::text as senha_ok,
    ((SELECT email_confirmed_at FROM user_check) IS NOT NULL)::text as email_confirmado,
    ((SELECT user_id FROM identity_check) IS NOT NULL)::text as tem_identity,
    ((SELECT id FROM profile_check) IS NOT NULL)::text as tem_profile;
