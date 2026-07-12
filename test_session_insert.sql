-- TESTE DE ESCRITA: SESSÕES E TOKENS
-- Se o login falha, pode ser erro ao gravar a sessão.

WITH user_info AS (
    SELECT id FROM auth.users WHERE email = 'testeterceiro@hotmail.com' LIMIT 1
),
session_insert AS (
    INSERT INTO auth.sessions (id, user_id, created_at, updated_at)
    SELECT gen_random_uuid(), id, now(), now()
    FROM user_info
    RETURNING id
)
SELECT 
    'Sessão criada com sucesso' as status,
    id as session_id
FROM session_insert;

-- Nota: Isso vai criar uma sessão "lixo". O Supabase limpa depois ou ignoramos.
