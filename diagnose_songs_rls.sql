-- DIAGRÓSTICO DE RLS EM SONGS
-- Se o RLS estiver ativado e não tiver política, o SELECT retorna vazio (ou erro).

-- 1. RLS está ligado na tabela songs?
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'songs';

-- 2. Quais políticas existem para songs?
SELECT policyname, cmd, roles, qual, permissive 
FROM pg_policies 
WHERE tablename = 'songs';
