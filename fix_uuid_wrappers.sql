-- CORREÇÃO DE UUID (WRAPPER PÚBLICO)
-- O Login pode estar falhando ao tentar gerar ID de sessão se não achar o uuid-ossp.

BEGIN;

-- 1. Garante permissão
GRANT USAGE ON SCHEMA extensions TO public;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO public;

-- 2. Cria Wrapper para uuid_generate_v4 (se o sistema buscar em public)
CREATE OR REPLACE FUNCTION public.uuid_generate_v4() RETURNS uuid AS $$
    SELECT extensions.uuid_generate_v4();
$$ LANGUAGE sql SECURITY DEFINER;

COMMIT;

-- 3. Teste Visual
SELECT 
    'Teste UUID' as teste,
    public.uuid_generate_v4() as id_gerado,
    'Se apareceu ID, o problema de UUID está resolvido.' as status;
