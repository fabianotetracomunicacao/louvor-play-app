-- Comparação COMPLETA testeoitavo vs testesetimo
WITH oitavo AS (
    SELECT * FROM auth.users WHERE email = 'testeoitavo@hotmail.com'
),
setimo AS (
    SELECT * FROM auth.users WHERE email = 'testesetimo@hotmail.com'
)
SELECT 
    'instance_id' as campo,
    o.instance_id::text as oitavo_valor,
    s.instance_id::text as setimo_valor,
    (o.instance_id = s.instance_id)::text as igual
FROM oitavo o, setimo s

UNION ALL

SELECT 'aud', o.aud::text, s.aud::text, (o.aud = s.aud)::text
FROM oitavo o, setimo s

UNION ALL

SELECT 'role', o.role::text, s.role::text, (o.role = s.role)::text
FROM oitavo o, setimo s

UNION ALL

SELECT 'email_confirmed_at', 
    CASE WHEN o.email_confirmed_at IS NULL THEN 'NULL' ELSE 'NOT NULL' END,
    CASE WHEN s.email_confirmed_at IS NULL THEN 'NULL' ELSE 'NOT NULL' END,
    (o.email_confirmed_at IS NOT NULL AND s.email_confirmed_at IS NOT NULL)::text
FROM oitavo o, setimo s

UNION ALL

SELECT 'confirmed_at',
    CASE WHEN o.confirmed_at IS NULL THEN 'NULL' ELSE 'NOT NULL' END,
    CASE WHEN s.confirmed_at IS NULL THEN 'NULL' ELSE 'NOT NULL' END,
    (o.confirmed_at IS NOT NULL AND s.confirmed_at IS NOT NULL)::text
FROM oitavo o, setimo s

UNION ALL

SELECT 'raw_app_meta_data', 
    o.raw_app_meta_data::text,
    s.raw_app_meta_data::text,
    (o.raw_app_meta_data = s.raw_app_meta_data)::text
FROM oitavo o, setimo s

UNION ALL

SELECT 'raw_user_meta_data',
    o.raw_user_meta_data::text,
    s.raw_user_meta_data::text,
    (o.raw_user_meta_data::jsonb - 'sub' = s.raw_user_meta_data::jsonb - 'sub')::text
FROM oitavo o, setimo s

UNION ALL

SELECT 'is_sso_user',
    o.is_sso_user::text,
    s.is_sso_user::text,
    (o.is_sso_user = s.is_sso_user)::text
FROM oitavo o, setimo s

UNION ALL

SELECT 'is_anonymous',
    o.is_anonymous::text,
    s.is_anonymous::text,
    (o.is_anonymous = s.is_anonymous)::text
FROM oitavo o, setimo s

UNION ALL

SELECT 'deleted_at',
    CASE WHEN o.deleted_at IS NULL THEN 'NULL' ELSE 'NOT NULL' END,
    CASE WHEN s.deleted_at IS NULL THEN 'NULL' ELSE 'NOT NULL' END,
    (o.deleted_at IS NULL AND s.deleted_at IS NULL)::text
FROM oitavo o, setimo s

UNION ALL

SELECT 'banned_until',
    CASE WHEN o.banned_until IS NULL THEN 'NULL' ELSE 'NOT NULL' END,
    CASE WHEN s.banned_until IS NULL THEN 'NULL' ELSE 'NOT NULL' END,
    (o.banned_until IS NULL AND s.banned_until IS NULL)::text
FROM oitavo o, setimo s;
