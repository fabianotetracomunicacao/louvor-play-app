-- Corrigir identity_data do testesetimo
DO $$
DECLARE
    target_user_id uuid;
    correct_email text := 'testesetimo@hotmail.com';
BEGIN
    -- Pegar o ID do testesetimo
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = correct_email;
    
    -- Atualizar identity_data
    UPDATE auth.identities
    SET identity_data = jsonb_build_object(
        'sub', target_user_id::text,
        'email', correct_email,
        'email_verified', false,
        'phone_verified', false,
        'provider', 'email'
    ),
    updated_at = now()
    WHERE user_id = target_user_id;
    
    RAISE NOTICE 'identity_data atualizado!';
    RAISE NOTICE 'User ID: %', target_user_id;
    RAISE NOTICE 'Email correto: %', correct_email;
    
END $$;
