-- Comparação COMPLETA campo por campo
WITH setimo AS (
    SELECT * FROM auth.users WHERE email = 'testesetimo@hotmail.com'
),
sexto AS (
    SELECT * FROM auth.users WHERE email = 'testesexto@hotmail.com'
)
SELECT 
    'instance_id' as campo,
    setimo.instance_id::text as setimo_valor,
    sexto.instance_id::text as sexto_valor,
    (setimo.instance_id = sexto.instance_id) as igual
FROM setimo, sexto
UNION ALL
SELECT 'aud', setimo.aud, sexto.aud, (setimo.aud = sexto.aud)
FROM setimo, sexto
UNION ALL
SELECT 'role', setimo.role, sexto.role, (setimo.role = sexto.role)
FROM setimo, sexto
UNION ALL
SELECT 'email_confirmed_at', setimo.email_confirmed_at::text, sexto.email_confirmed_at::text, 
    (setimo.email_confirmed_at IS NOT NULL AND sexto.email_confirmed_at IS NOT NULL)
FROM setimo, sexto
UNION ALL
SELECT 'confirmed_at', setimo.confirmed_at::text, sexto.confirmed_at::text,
    (setimo.confirmed_at IS NOT NULL AND sexto.confirmed_at IS NOT NULL)
FROM setimo, sexto
UNION ALL
SELECT 'is_sso_user', setimo.is_sso_user::text, sexto.is_sso_user::text, (setimo.is_sso_user = sexto.is_sso_user)
FROM setimo, sexto
UNION ALL
SELECT 'deleted_at', COALESCE(setimo.deleted_at::text, 'NULL'), COALESCE(sexto.deleted_at::text, 'NULL'),
    (setimo.deleted_at IS NULL AND sexto.deleted_at IS NULL)
FROM setimo, sexto
UNION ALL
SELECT 'banned_until', COALESCE(setimo.banned_until::text, 'NULL'), COALESCE(sexto.banned_until::text, 'NULL'),
    (setimo.banned_until IS NULL AND sexto.banned_until IS NULL)
FROM setimo, sexto
UNION ALL
SELECT 'is_anonymous', setimo.is_anonymous::text, sexto.is_anonymous::text, (setimo.is_anonymous = sexto.is_anonymous)
FROM setimo, sexto
UNION ALL
SELECT 'raw_app_meta_data', setimo.raw_app_meta_data::text, sexto.raw_app_meta_data::text,
    (setimo.raw_app_meta_data = sexto.raw_app_meta_data)
FROM setimo, sexto
UNION ALL
SELECT 'raw_user_meta_data', setimo.raw_user_meta_data::text, sexto.raw_user_meta_data::text,
    (setimo.raw_user_meta_data = sexto.raw_user_meta_data)
FROM setimo, sexto;
