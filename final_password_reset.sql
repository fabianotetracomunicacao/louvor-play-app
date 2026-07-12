-- FINAL PASSWORD RESET (Reset Final de Senha)
-- Agora que arrumamos a extensão 'pgcrypto' e as permissões,
-- precisamos gerar o HASH da senha novamente para garantir que ele é válido.

DO $$
BEGIN
    -- Forçar uso do pgcrypto do schema public (o que movemos)
    -- Senha: '123456'
    
    UPDATE auth.users 
    SET encrypted_password = public.crypt('123456', public.gen_salt('bf')),
        updated_at = now()
    WHERE email = 'teste_supremo@tetracom.com';

    RAISE NOTICE '✅ Senha re-gerada com sucesso (usando public.crypt).';
    RAISE NOTICE 'Tente logar com teste_supremo@tetracom.com / 123456';
END $$;
