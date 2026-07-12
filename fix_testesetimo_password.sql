-- Corrigir senha do testesetimo para 123456
DO $$
DECLARE
    target_user_id uuid;
    new_password text := '123456';
    password_hash text;
BEGIN
    -- Pegar o ID do testesetimo
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'testesetimo@hotmail.com';
    
    -- Gerar hash da senha correta
    password_hash := extensions.crypt(new_password, extensions.gen_salt('bf'));
    
    -- Atualizar senha
    UPDATE auth.users
    SET encrypted_password = password_hash,
        updated_at = now()
    WHERE id = target_user_id;
    
    RAISE NOTICE 'Senha atualizada para: %', new_password;
    RAISE NOTICE 'User ID: %', target_user_id;
    RAISE NOTICE 'Hash: %', password_hash;
    
END $$;
