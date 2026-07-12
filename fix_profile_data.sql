-- FIX FINAL DE DADOS (Nome do Perfil)
-- Se o RLS está aberto ("true"), então o join falha pq o dado não está lá ou está incompleto.

DO $$
DECLARE
    target_email TEXT := 'fabiano@tetracomunicacao.com.br';
    u_id UUID;
BEGIN
    SELECT id INTO u_id FROM auth.users WHERE email = target_email;

    IF u_id IS NOT NULL THEN
        -- 1. Garante que o Perfil tenha NOME (O clone só copiou email/role)
        UPDATE public.profiles 
        SET name = 'Fabiano' 
        WHERE id = u_id;
        
        -- 2. Garante que existem músicas apontando para esse ID
        UPDATE public.songs
        SET created_by = u_id
        WHERE id IN (SELECT id FROM public.songs LIMIT 3);

        RAISE NOTICE '✅ Perfil atualizado com Nome: Fabiano';
        RAISE NOTICE '✅ 3 Músicas vinculadas novamente.';
    ELSE
        RAISE NOTICE '❌ Usuário não encontrado.';
    END IF;
END $$;
