-- Corrigir provider_id do testeoitavo
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Pegar o ID do testeoitavo
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'testeoitavo@hotmail.com';
    
    -- Atualizar provider_id para ser igual ao user_id
    UPDATE auth.identities
    SET provider_id = target_user_id::text,
        updated_at = now()
    WHERE user_id = target_user_id;
    
    RAISE NOTICE 'provider_id corrigido!';
    RAISE NOTICE 'User ID: %', target_user_id;
    RAISE NOTICE 'Provider ID agora: %', target_user_id::text;
    
END $$;
