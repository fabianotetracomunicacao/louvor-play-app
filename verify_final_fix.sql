-- VERIFICAÇÃO FINAL (COM TABELA)
-- Se isso retornar dados, o login TEM QUE FUNCIONAR.

SELECT 
    extname, 
    extnamespace::regnamespace as ONDE_ESTA_AGORA,
    extensions.crypt('teste', extensions.gen_salt('bf')) as PROVA_QUE_FUNCIONA
FROM pg_extension 
WHERE extname = 'pgcrypto';
