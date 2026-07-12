-- DIAGRÓSTICO DO NOVO USUÁRIO (testeterceiro)
-- Queremos ver como ele nasceu: se tem perfil, se tem metadados, se a trigger rodou.

SELECT 
    id, 
    email, 
    role, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    last_sign_in_at,
    (SELECT count(*) FROM auth.identities WHERE user_id = auth.users.id) as identities_count
FROM auth.users
WHERE email = 'testeterceiro@hotmail.com';

SELECT * FROM public.profiles WHERE email = 'testeterceiro@hotmail.com';
