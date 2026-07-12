-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
    link TEXT, -- Optional link to navigate to
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies (as defined in reset_notifications_policies.sql but ensuring creation)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Enable insert for authenticated users') THEN
        CREATE POLICY "Enable insert for authenticated users" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Enable select for users based on user_id') THEN
        CREATE POLICY "Enable select for users based on user_id" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Enable update for users based on user_id') THEN
        CREATE POLICY "Enable update for users based on user_id" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    END IF;
END $$;
