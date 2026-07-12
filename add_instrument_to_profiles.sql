DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'instrument') THEN 
        ALTER TABLE profiles ADD COLUMN instrument text; 
    END IF; 
END $$;
