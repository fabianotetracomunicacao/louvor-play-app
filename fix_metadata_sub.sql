-- FIX METADATA (O Elo Perdido)
-- A comparação mostrou que os usuários que funcionam têm o campo "sub" nos metadados.
-- Os novos não têm. Vamos injetar esse dado manualmente.

DO $$
BEGIN
    -- 1. Corrigir FABIANO
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object(
        'sub', id, 
        'email', email,
        'email_verified', true
    )
    WHERE email = 'fabiano@tetracomunicacao.com.br';

    -- 2. Corrigir TESTE SUPREMO (para validação)
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object(
        'sub', id,
        'email', email,
        'email_verified', true
    )
    WHERE email = 'teste_supremo@tetracom.com';

    RAISE NOTICE '✅ Metadados corrigidos! Campo "sub" injetado.';
    RAISE NOTICE 'Tente logar agora.';
END $$;
