-- "RESET" DE SENHA (TESTEQUARTO)
-- A senha atual "parece" certa, mas o sistema odeia ela.
-- Vamos sobreescrever com um hash gerado pelo NOSSO método (que funciona no login_test).

UPDATE auth.users
SET encrypted_password = public.crypt('123456', public.gen_salt('bf'))
WHERE email = 'testequarto@hotmail.com';

SELECT 'Senha redefinida com criptografia forçada via SQL.' as status;
