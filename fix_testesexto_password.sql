-- Atualizar senha do testesexto para 123456 (senha original)
DO $$
DECLARE
    target_user_id uuid := '541739d0-35a1-4807-9631-5b0f90233440';
    new_password text := '123456';
    password_hash text;
BEGIN
    -- Gerar hash da senha correta
    password_hash := extensions.crypt(new_password, extensions.gen_salt('bf'));
    
    -- Atualizar
    UPDATE auth.users
    SET encrypted_password = password_hash,
        updated_at = now()
    WHERE id = target_user_id;
    
    RAISE NOTICE 'Senha atualizada para: %', new_password;
    RAISE NOTICE 'Hash: %', password_hash;
    
END $$;
