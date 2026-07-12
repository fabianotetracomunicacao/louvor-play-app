-- CORRIGIR NOME DO ADMIN
-- O "Novo Usuário" é, na verdade, você (o Admin).
-- Isso acontece porque o cadastro inicial colocou um nome padrão.

-- 1. Atualizar o nome do perfil
UPDATE public.profiles
SET name = 'Fabiano Fischer'
WHERE email = 'fabiano_fischer@hotmail.com';

-- 2. Garantir que todas as músicas sejam do Admin (Cinto de Segurança)
UPDATE public.songs
SET created_by = (SELECT id FROM auth.users WHERE email = 'fabiano_fischer@hotmail.com');

-- 3. Garantir que todas as playlists sejam do Admin
UPDATE public.playlists
SET owner_id = (SELECT id FROM auth.users WHERE email = 'fabiano_fischer@hotmail.com');

SELECT 'Nome atualizado com sucesso!' as status;
