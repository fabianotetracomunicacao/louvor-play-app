-- Comparar TODOS os campos relevantes para login
SELECT 
    'testesexto' as usuario,
    email,
    email_confirmed_at,
    confirmed_at,
    deleted_at,
    banned_until,
    is_anonymous,
    aud,
    role,
    raw_app_meta_data,
    raw_user_meta_data
FROM auth.users
WHERE email = 'testesexto@hotmail.com'

UNION ALL

SELECT 
    'novapessoa2' as usuario,
    email,
    email_confirmed_at,
    confirmed_at,
    deleted_at,
    banned_until,
    is_anonymous,
    aud,
    role,
    raw_app_meta_data,
    raw_user_meta_data
FROM auth.users
WHERE email = 'novapessoa2@hotmail.com';
