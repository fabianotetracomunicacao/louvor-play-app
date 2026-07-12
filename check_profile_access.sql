-- CHECK DE PERFIL E RLS (Versão Corrigida)
-- Testando para o usuário: testesegundo@hotmail.com.br
-- ID: 3ea71fdf-6b97-4fa6-8ba5-fea8158f9f7d

SET ROLE authenticated;
SET request.jwt.claim.sub = '3ea71fdf-6b97-4fa6-8ba5-fea8158f9f7d';

DO $$
DECLARE
    v_user_id UUID := '3ea71fdf-6b97-4fa6-8ba5-fea8158f9f7d';
BEGIN
    RAISE NOTICE '🕵️‍♂️ Testando leitura de perfil para ID: %', v_user_id;
    
    PERFORM * FROM public.profiles WHERE id = v_user_id;
    
    IF FOUND THEN
        RAISE NOTICE '✅ SUCESSO! O perfil foi lido corretamente.';
    ELSE
        RAISE NOTICE '❌ FALHA! O perfil não foi encontrado ou está bloqueado por RLS.';
    END IF;
END $$;
