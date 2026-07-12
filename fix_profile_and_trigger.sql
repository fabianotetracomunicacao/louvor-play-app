-- REPARO FINAL: CRIAÇÃO DE PERFIL E AUTOMATIZAÇÃO
-- 1. Cria o perfil para o usuário de teste atual.
-- 2. Instala o Trigger para que novos usuários ganhem perfil automaticamente.

BEGIN;

-- A. CRIA PERFIL MANUALMENTE (Para o login_test)
INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
    id, 
    email, 
    'member', -- Role padrão
    'Usuário de Teste',
    now(),
    now()
FROM auth.users
WHERE email = 'login_test@teste.com'
ON CONFLICT (id) DO NOTHING;

-- B. CRIA FUNÇÃO DO TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
  VALUES (
    new.id, 
    new.email, 
    'member', 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. CRIA O TRIGGER NA TABELA AUTH.USERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMIT;

SELECT 'Perfil criado e Trigger automático instalado!' as status;
