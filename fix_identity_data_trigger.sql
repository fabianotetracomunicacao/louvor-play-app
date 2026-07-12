-- Função para corrigir identity_data de usuários criados pelo app
CREATE OR REPLACE FUNCTION fix_user_identity_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se identity_data não tem email
    IF NEW.identity_data->>'email' IS NULL THEN
        -- Buscar email do usuário
        NEW.identity_data = NEW.identity_data || jsonb_build_object(
            'email', (SELECT email FROM auth.users WHERE id = NEW.user_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para corrigir automaticamente
DROP TRIGGER IF EXISTS fix_identity_data_trigger ON auth.identities;
CREATE TRIGGER fix_identity_data_trigger
    BEFORE INSERT OR UPDATE ON auth.identities
    FOR EACH ROW
    EXECUTE FUNCTION fix_user_identity_data();

-- Corrigir usuários existentes
UPDATE auth.identities
SET identity_data = identity_data || jsonb_build_object(
    'email', (SELECT email FROM auth.users WHERE id = auth.identities.user_id)
)
WHERE identity_data->>'email' IS NULL
  AND provider = 'email';
