-- Force delete user by email (Handles the "Zombie User" case)
-- Use this when a user exists in Auth but not in Profiles (so they don't appear in the Admin UI)

DO $$
DECLARE
    -- WARNING: Check the spelling carefully. User provided: 'fabiano@tetracomuncacao.com.br'
    target_email TEXT := 'fabiano@tetracomuncacao.com.br'; 
    target_id UUID;
BEGIN
    -- Find the user in the Auth table
    SELECT id INTO target_id FROM auth.users WHERE email = target_email;
    
    IF target_id IS NULL THEN
        RAISE NOTICE 'Nenhum usuário encontrado com o email: %', target_email;
        -- Tip: Try searching with wildcards if you suspect a typo: 
        -- SELECT email FROM auth.users WHERE email LIKE '%fabiano%';
    ELSE
        -- Delete from Auth (This is the "Source of Truth")
        DELETE FROM auth.users WHERE id = target_id;
        
        -- Try to delete from profiles just in case (ignore if already gone)
        DELETE FROM public.profiles WHERE id = target_id;

        RAISE NOTICE 'SUCESSO: Usuário % (ID: %) foi removido completamente.', target_email, target_id;
    END IF;
END $$;
