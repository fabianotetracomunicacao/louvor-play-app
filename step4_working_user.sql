-- PASSO 4: Dados do usuário que FUNCIONA (novapessoa2)

-- auth.users
SELECT 'AUTH.USERS' as table_name;
SELECT * FROM auth.users WHERE email = 'novapessoa2@hotmail.com';

-- auth.identities
SELECT 'AUTH.IDENTITIES' as table_name;
SELECT 
    provider_id,
    id,
    user_id,
    jsonb_pretty(identity_data) as identity_data_formatted,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    email
FROM auth.identities 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'novapessoa2@hotmail.com');

-- public.profiles
SELECT 'PUBLIC.PROFILES' as table_name;
SELECT * FROM public.profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'novapessoa2@hotmail.com');
