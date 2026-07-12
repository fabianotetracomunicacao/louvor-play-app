-- REPARO FINAL V3 (SEM UPDATED_AT)
-- A tabela é enxuta: id, email, role, name, created_at.

BEGIN;

-- A. CRIA PERFIL MANUALMENTE
INSERT INTO public.profiles (id, email, role, name, created_at)
SELECT 
    id, 
    email, 
    'member'::public.app_role, 
    'Usuário de Teste',
    now()
FROM auth.users
WHERE email = 'login_test@teste.com'
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- B. CRIA FUNÇÃO DO TRIGGER (AJUSTADA)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, created_at)
  VALUES (
    new.id, 
    new.email, 
    'member'::public.app_role, 
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

SELECT 'Perfil criado (v3) e Trigger corrigido para sempre!' as status;
