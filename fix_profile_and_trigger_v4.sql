-- REPARO FINAL V4 (AGORA VAI!)
-- Tabela: id, email, role, name, created_at.
-- Tipo do role: public.user_role

BEGIN;

-- A. CRIA PERFIL MANUALMENTE
INSERT INTO public.profiles (id, email, role, name, created_at)
SELECT 
    id, 
    email, 
    'member'::public.user_role, -- Cast CORRETO agora
    'Usuário de Teste',
    now()
FROM auth.users
WHERE email = 'login_test@teste.com'
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- B. CRIA FUNÇÃO DO TRIGGER (COM CAST E COLUNAS CERTAS)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, created_at)
  VALUES (
    new.id, 
    new.email, 
    'member'::public.user_role, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Novo Usuário'),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. CRIA O TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMIT;

SELECT 'Perfil criado V4 (tipo user_role) e Trigger corrigido!' as status;
