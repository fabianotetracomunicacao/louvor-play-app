-- DIAGNÓSTICO: Por que o nome do editor não aparece?
-- 1. Ver se as músicas têm 'created_by' preenchido.
-- 2. Ver se conseguimos chegar no nome através do JOIN.

WITH song_sample AS (
    SELECT id, title, created_by 
    FROM public.songs 
    WHERE created_by IS NOT NULL 
    LIMIT 5
)
SELECT 
    s.title,
    s.created_by,
    p.email as email_perfil,
    p.name as nome_perfil,
    CASE WHEN p.id IS NOT NULL THEN '✅ VÍNCULO OK' ELSE '❌ SEM PERFIL' END as status_vinculo
FROM song_sample s
LEFT JOIN public.profiles p ON s.created_by = p.id;

-- Checar Policies da tabela Profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
