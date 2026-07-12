-- TESTE DE CRIPTOGRAFIA (COM SELECT)
-- Esse vai mostrar o resultado na tabela.

SELECT 
    'extensions' as schema_testado,
    extensions.crypt('teste', extensions.gen_salt('bf')) as hash_gerado
UNION ALL
SELECT 
    'public' as schema_testado,
    public.crypt('teste', public.gen_salt('bf')) as hash_gerado;
