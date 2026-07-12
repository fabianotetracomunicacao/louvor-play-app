-- PREPARAR TERRENO PARA TESTE DE TRANSFERÊNCIA
-- Atribui algumas músicas existentes ao usuário 'Fabiano' para ele virar um "Criador de Conteúdo".
-- Assim, ao tentar deletá-lo, o App será obrigado a mostrar a janela de transferência.

DO $$
DECLARE
    target_email TEXT := 'fabiano@tetracomunicacao.com.br';
    target_id UUID;
BEGIN
    -- 1. Pega o ID do Fabiano
    SELECT id INTO target_id FROM auth.users WHERE email = target_email;

    IF target_id IS NOT NULL THEN
        -- 2. Passa 3 músicas aleatórias para o nome dele
        UPDATE public.songs 
        SET created_by = target_id
        WHERE id IN (
            SELECT id FROM public.songs ORDER BY created_at DESC LIMIT 3
        );
        
        RAISE NOTICE '✅ SUCESSO! 3 músicas agora pertencem ao Fabiano.';
        RAISE NOTICE 'Agora vá no App > Admin > Usuários e tente EXCLUIR o Fabiano.';
        RAISE NOTICE 'A janela de "Transferência Obrigatória" deve aparecer.';
    ELSE
        RAISE NOTICE '❌ Erro: Usuário Fabiano não encontrado.';
    END IF;
END $$;
