-- FIX SYSTEM PERMISSIONS (Correção de Permissões)
-- Às vezes o erro 500 é falta de permissão básica de 'uso' nos schemas.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- Garantir que todos podem ler a tabela de perfis (já que desligamos o RLS, precisa de GRANT)
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.playlist_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.songs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.playlists TO anon, authenticated, service_role;

RAISE NOTICE '✅ Permissões de Schema e Tabelas reaplicadas.';
