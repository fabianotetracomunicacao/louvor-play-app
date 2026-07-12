-- Restore Profile for existing Auth User
-- This allows the user to appear in the Admin UI again, so you can test the "Delete & Transfer" flow.

DO $$
DECLARE
    -- Searching for the email (handling potential typo from previous requests)
    target_email TEXT := 'fabiano@tetracomuncacao.com.br'; 
    found_id UUID;
    real_email TEXT;
BEGIN
    -- 1. Try exact match
    SELECT id, email INTO found_id, real_email FROM auth.users WHERE email = target_email;

    -- 2. If not found, try the likely correct spelling (tetracomunicacao)
    IF found_id IS NULL THEN
        SELECT id, email INTO found_id, real_email FROM auth.users WHERE email = 'fabiano@tetracomunicacao.com.br';
    END IF;

    -- 3. If still not found, try fuzzy match on 'fabiano'
    IF found_id IS NULL THEN
         SELECT id, email INTO found_id, real_email FROM auth.users WHERE email ILIKE '%fabiano%' LIMIT 1;
    END IF;

    IF found_id IS NOT NULL THEN
        -- Re-insert into profiles
        INSERT INTO public.profiles (id, email, role, created_at)
        VALUES (found_id, real_email, 'editor', now()) -- Restoring as Editor
        ON CONFLICT (id) DO UPDATE SET 
            role = 'editor', -- Ensure they have a role that allows managing
            email = EXCLUDED.email;
            
        RAISE NOTICE 'SUCESSO! O perfil de % foi restaurado.', real_email;
    ELSE
        RAISE EXCEPTION 'Erro: Não encontrei nenhum usuário Fabiano no sistema de login (Auth). Verifique o e-mail.';
    END IF;
END $$;
