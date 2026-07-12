-- Criar trigger para corrigir raw_user_meta_data automaticamente
CREATE OR REPLACE FUNCTION fix_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Se raw_user_meta_data não tem 'sub', adicionar
    IF NEW.raw_user_meta_data->>'sub' IS NULL THEN
        NEW.raw_user_meta_data = NEW.raw_user_meta_data || jsonb_build_object('sub', NEW.id::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger BEFORE INSERT
DROP TRIGGER IF EXISTS fix_metadata_trigger ON auth.users;
CREATE TRIGGER fix_metadata_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION fix_user_metadata();

-- Corrigir usuário existente (testdecimo)
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object('sub', id::text)
WHERE email = 'testedecimo@hotmail.com';

-- Verificar
SELECT 
    email,
    raw_user_meta_data,
    (encrypted_password = extensions.crypt('123456', encrypted_password)) as senha_ok
FROM auth.users
WHERE email = 'testedecimo@hotmail.com';
