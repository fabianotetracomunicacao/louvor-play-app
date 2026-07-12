-- Verificar raw_user_meta_data do último usuário
SELECT 
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_ok
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;
