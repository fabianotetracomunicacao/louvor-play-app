-- Corrigir raw_user_meta_data do testeoitavo
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Pegar o ID do testeoitavo
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'testeoitavo@hotmail.com';
    
    -- Atualizar raw_user_meta_data com o sub
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object('sub', target_user_id::text),
        updated_at = now()
    WHERE id = target_user_id;
    
    RAISE NOTICE 'raw_user_meta_data atualizado!';
    RAISE NOTICE 'User ID: %', target_user_id;
    
END $$;
