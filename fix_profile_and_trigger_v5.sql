-- REPARO FINAL V5 (AGORA VAI 100%!)
-- Tabela: id, email, role, name, created_at.
-- Tipo do role: public.user_role
-- Valores válidos: 'admin', 'editor', 'musician'. Vamos usar 'musician'.

BEGIN;

-- A. CRIA PERFIL MANUALMENTE (Para o login_test)
INSERT INTO public.profiles (id, email, role, name, created_at)
SELECT 
    id, 
    email, 
    'musician'::public.user_role, -- Agora com valor existente!
    'Usuário de Teste',
    now()
FROM auth.users
WHERE email = 'login_test@teste.com'
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- B. CRIA FUNÇÃO DO TRIGGER (COM DEFAULT MUSICIAN)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, created_at)
  VALUES (
    new.id, 
    new.email, 
    'musician'::public.user_role, -- Default para novos cadastros
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

SELECT 'Perfil criado V5 (role musician) e Trigger corrigido!' as status;
