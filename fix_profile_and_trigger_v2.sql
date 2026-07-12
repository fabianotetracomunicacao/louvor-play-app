-- REPARO FINAL V2 (CORRIGIDO)
-- Agora usando o nome certo da coluna: 'name'.

BEGIN;

-- A. CRIA PERFIL MANUALMENTE (Para o login_test)
INSERT INTO public.profiles (id, email, role, name, created_at, updated_at)
SELECT 
    id, 
    email, 
    'member'::public.app_role, -- Cast explicito para garantir
    'Usuário de Teste',
    now(),
    now()
FROM auth.users
WHERE email = 'login_test@teste.com'
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name; -- Update se já existir (segurança)

-- B. CRIA FUNÇÃO DO TRIGGER (COM NOME CERTO)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, created_at, updated_at)
  VALUES (
    new.id, 
    new.email, 
    'member'::public.app_role, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Novo Usuário'),
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

SELECT 'Perfil criado (coluna name) e Trigger corrigido!' as status;
