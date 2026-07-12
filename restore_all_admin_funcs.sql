-- RESTAURAR FUNÇÕES DE ADMINISTRAÇÃO (DELETE E SENHA)
-- Essas funções são usadas pelo Painel de Admin para gerenciar usuários.

-- Função 1: Excluir Usuário com Transferência de herança
CREATE OR REPLACE FUNCTION public.delete_user_with_transfer(
    target_user_id UUID,
    successor_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    caller_role public.user_role;
BEGIN
    -- Verificação de Segurança (Permite admin e super_admin)
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF caller_role NOT IN ('admin'::public.user_role, 'super_admin'::public.user_role) THEN
        RAISE EXCEPTION 'Acesso Negado: Apenas administradores podem excluir usuários.';
    END IF;

    -- Transferir Músicas e Playlists (se houver sucessor)
    IF successor_id IS NOT NULL THEN
        UPDATE public.songs SET created_by = successor_id WHERE created_by = target_user_id;
        UPDATE public.playlists SET owner_id = successor_id WHERE owner_id = target_user_id;
    END IF;

    -- Excluir o Usuário (Isso vai excluir o Profile em cascata)
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;


-- Função 2: Alterar Senha de Usuário pelo Painel
CREATE OR REPLACE FUNCTION public.update_user_password_by_admin(
    target_user_id UUID,
    new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    caller_role public.user_role;
BEGIN
    -- Verificação de Segurança (Permite admin e super_admin)
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF caller_role NOT IN ('admin'::public.user_role, 'super_admin'::public.user_role) THEN
        RAISE EXCEPTION 'Acesso Negado: Apenas administradores podem alterar senhas.';
    END IF;

    -- Atualizar a senha criptografada
    UPDATE auth.users 
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE id = target_user_id;
END;
$$;

SELECT 'Funções de Administração (Delete/Nova Senha) restauradas!' as status;
