-- Verificar se o sub no metadata está correto
SELECT 
    email,
    id as user_id_real,
    raw_user_meta_data->>'sub' as sub_no_metadata,
    (id::text = raw_user_meta_data->>'sub') as sub_correto
FROM auth.users
WHERE email IN ('testesetimo@hotmail.com', 'testesexto@hotmail.com')
ORDER BY email;
