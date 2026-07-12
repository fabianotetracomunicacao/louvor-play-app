-- SCRIPT PARA TROCAR SENHA MANUALMENTE
-- Substitua 'SuaNovaSenha' pela senha que deseja.
-- Substitua 'seu_email@dominio.com' pelo seu email.

DO $$
DECLARE
    target_email TEXT := 'fabiano_fischer@hotmail.com'; -- COLOQUE SEU EMAIL AQUI
    new_password TEXT := 'nova_senha_secreta'; -- COLOQUE A NOVA SENHA AQUI
BEGIN
    UPDATE auth.users
    SET encrypted_password = public.crypt(new_password, public.gen_salt('bf')),
        updated_at = now()
    WHERE email = target_email;
    
    RAISE NOTICE '✅ Senha alterada com sucesso para o usuário: %', target_email;
END $$;
