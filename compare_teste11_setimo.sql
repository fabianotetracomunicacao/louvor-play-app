-- Comparação COMPLETA: teste11 (falha) vs testesetimo (funciona)
WITH teste11 AS (
    SELECT * FROM auth.users WHERE email = 'teste11@hotmail.com'
),
setimo AS (
    SELECT * FROM auth.users WHERE email = 'testesetimo@hotmail.com'
)
SELECT 
    'raw_user_meta_data' as campo,
    t.raw_user_meta_data::text as teste11_valor,
    s.raw_user_meta_data::text as setimo_valor,
    (t.raw_user_meta_data::jsonb - 'sub' = s.raw_user_meta_data::jsonb - 'sub')::text as igual_sem_sub
FROM teste11 t, setimo s

UNION ALL

SELECT 'raw_app_meta_data',
    t.raw_app_meta_data::text,
    s.raw_app_meta_data::text,
    (t.raw_app_meta_data = s.raw_app_meta_data)::text
FROM teste11 t, setimo s

UNION ALL

SELECT 'email_confirmed_at',
    CASE WHEN t.email_confirmed_at IS NULL THEN 'NULL' ELSE 'NOT NULL' END,
    CASE WHEN s.email_confirmed_at IS NULL THEN 'NULL' ELSE 'NOT NULL' END,
    (t.email_confirmed_at IS NOT NULL AND s.email_confirmed_at IS NOT NULL)::text
FROM teste11 t, setimo s

UNION ALL

SELECT 'senha_ok',
    (t.encrypted_password = extensions.crypt('123456', t.encrypted_password))::text,
    (s.encrypted_password = extensions.crypt('123456', s.encrypted_password))::text,
    'N/A'
FROM teste11 t, setimo s;
