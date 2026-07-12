-- COMPARAÇÃO ABSOLUTA: auth.users
-- Vamos ver TODOS os campos da tabela auth.users
-- Lado a lado: SQL (funciona) vs App (falha)

SELECT 
    email,
    instance_id,
    aud,
    role,
    email_confirmed_at IS NOT NULL as email_confirmado,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    last_sign_in_at,
    raw_app_meta_data::text as app_metadata,
    raw_user_meta_data::text as user_metadata,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    confirmed_at,
    email_change_sent_at,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
FROM auth.users
WHERE email IN (
    'login_test@teste.com',      -- SQL (Funciona)
    'testequarto@hotmail.com',   -- App (Falha)
    'novapessoa2@hotmail.com'    -- SQL (Funciona)
)
ORDER BY created_at;
