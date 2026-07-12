-- Comparar raw_app_meta_data e raw_user_meta_data em detalhe
SELECT 
    'testesetimo (FALHA)' as origem,
    email,
    raw_app_meta_data::text as app_meta,
    raw_user_meta_data::text as user_meta,
    jsonb_pretty(raw_app_meta_data) as app_meta_pretty,
    jsonb_pretty(raw_user_meta_data) as user_meta_pretty
FROM auth.users
WHERE email = 'testesetimo@hotmail.com'

UNION ALL

SELECT 
    'testesexto (FUNCIONA)' as origem,
    email,
    raw_app_meta_data::text as app_meta,
    raw_user_meta_data::text as user_meta,
    jsonb_pretty(raw_app_meta_data) as app_meta_pretty,
    jsonb_pretty(raw_user_meta_data) as user_meta_pretty
FROM auth.users
WHERE email = 'testesexto@hotmail.com';
