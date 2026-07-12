-- PROMOÇÃO PARA ADMIN (Teste de Permissão)
-- Vamos transformar o testesegundo em ADMIN/EDITOR igual o Fabiano.
-- Se ele logar agora, o problema é puramente PERMISSÃO (RLS) do papel 'musician'.

DO $$
BEGIN
    UPDATE auth.users
    SET 
        role = 'service_role', -- Admins geralmente tem role especial ou 'authenticated' com claim. Vamos tentar igualar ao que tiver no Fabiano.
        -- Na verdade, o Supabase usa 'authenticated' pra todo mundo, e o claim 'role' no metadata define o acesso no App.
        raw_user_meta_data = jsonb_build_object(
            'sub', id, 
            'email', email,
            'email_verified', true,
            'role', 'admin' -- AQUI QUE MANDA
        )
    WHERE email = 'testesegundo@hotmail.com.br';

    -- Atualiza também o public.profiles pra garantir
    UPDATE public.profiles
    SET role = 'admin'
    WHERE email = 'testesegundo@hotmail.com.br';

    RAISE NOTICE '✅ Usuário promovido a ADMIN. Tente logar.';
END $$;
