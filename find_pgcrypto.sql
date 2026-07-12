-- ONDE ESTÁ A CRIPTOGRAFIA?
-- Verifica em qual schema a extensão pgcrypto foi instalada.

SELECT extname, extversion, extnamespace::regnamespace as schema_instalacao
FROM pg_extension
WHERE extname = 'pgcrypto';
