-- SIMULAÇÃO DE LOGIN COMO SERVICE ROLE
-- O teste anterior funcionou porque rodou como "Deus" (superuser).
-- Agora vamos rodar como o "Sistema" (service_role) para ver se ele quebra.

DO $$
DECLARE
    target_email TEXT := 'teste_supremo@tetracom.com';
    u_id UUID;
BEGIN
    -- 1. Pega ID
    SELECT id INTO u_id FROM auth.users WHERE email = target_email;

    IF u_id IS NULL THEN
        RAISE EXCEPTION 'Usuário teste não encontrado.';
    END IF;

    -- 2. Tenta virar o Service Role (que o Supabase usa)
    -- Nota: 'service_role' geralmente tem super poderes, mas obedece algumas regras.
    -- Se falhar aqui, sabemos que é permissão.
    
    SET LOCAL ROLE service_role;
    
    RAISE NOTICE 'Role atual: service_role. Tentando atualizar...';

    UPDATE auth.users 
    SET last_sign_in_at = now() 
    WHERE id = u_id;
    
    RAISE NOTICE '✅ SUCESSO! service_role conseguiu atualizar.';
    
    -- Se passar daqui, o problema pode ser o 'supabase_auth_admin' (que não conseguimos assumir facilmente).
    -- Mas vamos testar o service_role primeiro.
    
    RESET ROLE; -- Volta ao normal

EXCEPTION WHEN OTHERS THEN
    RESET ROLE; -- Garante volta ao normal
    RAISE NOTICE '❌ FALHA COMO SERVICE ROLE: % (SQLState: %)', SQLERRM, SQLSTATE;
END $$;
