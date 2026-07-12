-- SIMULAÇÃO COM RESULTADO VISÍVEL
-- Retorna cada etapa como uma linha na tabela

WITH simulation AS (
    SELECT 
        1 as step,
        'Buscar usuário' as descricao,
        CASE 
            WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'testequarto@hotmail.com')
            THEN '✅ OK'
            ELSE '❌ FALHOU'
        END as resultado
    UNION ALL
    SELECT 
        2,
        'Verificar senha',
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM auth.users 
                WHERE email = 'testequarto@hotmail.com'
                AND encrypted_password = public.crypt('123456', encrypted_password)
            )
            THEN '✅ OK'
            ELSE '❌ FALHOU'
        END
    UNION ALL
    SELECT 
        3,
        'Buscar identidade',
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM auth.identities i
                JOIN auth.users u ON i.user_id = u.id
                WHERE u.email = 'testequarto@hotmail.com'
                AND i.provider = 'email'
            )
            THEN '✅ OK'
            ELSE '❌ FALHOU'
        END
    UNION ALL
    SELECT 
        4,
        'Buscar perfil',
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM public.profiles p
                JOIN auth.users u ON p.id = u.id
                WHERE u.email = 'testequarto@hotmail.com'
            )
            THEN '✅ OK'
            ELSE '❌ FALHOU'
        END
    UNION ALL
    SELECT 
        5,
        'Verificar email confirmado',
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM auth.users 
                WHERE email = 'testequarto@hotmail.com'
                AND email_confirmed_at IS NOT NULL
            )
            THEN '✅ OK'
            ELSE '❌ FALHOU'
        END
    UNION ALL
    SELECT 
        6,
        'Verificar não banido',
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM auth.users 
                WHERE email = 'testequarto@hotmail.com'
                AND (banned_until IS NULL OR banned_until < now())
            )
            THEN '✅ OK'
            ELSE '❌ FALHOU'
        END
    UNION ALL
    SELECT 
        7,
        'Verificar não deletado',
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM auth.users 
                WHERE email = 'testequarto@hotmail.com'
                AND deleted_at IS NULL
            )
            THEN '✅ OK'
            ELSE '❌ FALHOU'
        END
)
SELECT * FROM simulation
ORDER BY step;
