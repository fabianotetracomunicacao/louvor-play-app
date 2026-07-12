-- Remover email_verified do identity_data (deixar NULL como testesexto)
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Pegar o ID do testesetimo
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'testesetimo@hotmail.com';
    
    -- Atualizar identity_data removendo email_verified
    UPDATE auth.identities
    SET identity_data = identity_data - 'email_verified' - 'phone_verified',
        updated_at = now()
    WHERE user_id = target_user_id;
    
    RAISE NOTICE 'email_verified removido do identity_data!';
    
END $$;
