-- RESTAURAR FUNÇÃO DE CRIAÇÃO DE USUÁRIOS
-- Esta função permite que Admins criem outros usuários diretamente pelo painel.

-- 1. Habilitar extensão pgcrypto (necessária para senha)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. Recriar a função create_user_by_admin
CREATE OR REPLACE FUNCTION public.create_user_by_admin(
    new_email TEXT, 
    new_password TEXT, 
    new_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    new_id UUID;
    caller_role public.user_role;
BEGIN
    -- Verificação de Segurança de quem está chamando
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF caller_role IS DISTINCT FROM 'admin'::public.user_role THEN
        RAISE EXCEPTION 'Acesso Negado: Apenas administradores podem criar usuários.';
    END IF;

    -- Verificar se já existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = new_email) THEN
        RAISE EXCEPTION 'Usuário com este email já existe.';
    END IF;

    -- Inserir Usuário Auth
    new_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, recovery_sent_at, last_sign_in_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', 
        new_email, crypt(new_password, gen_salt('bf')), NOW(), NOW(), NOW(), 
        '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()
    );

    -- Inserir Perfil
    BEGIN
        INSERT INTO public.profiles (id, email, role, created_at)
        VALUES (
            new_id, 
            new_email, 
            new_role::public.user_role, 
            NOW()
        );
    EXCEPTION WHEN duplicate_object OR unique_violation THEN
        -- Se falhar o insert do profile, tenta corrigir
        UPDATE public.profiles 
        SET role = new_role::public.user_role 
        WHERE id = new_id;
    END;

    RETURN new_id;
END;
$$;

SELECT 'Função create_user_by_admin restaurada com sucesso!' as status;
