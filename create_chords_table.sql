-- Create chords table
CREATE TABLE IF NOT EXISTS chords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL,
    suffix TEXT NOT NULL,
    positions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(key, suffix)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS chords_key_suffix_idx ON chords (key, suffix);

-- Enable RLS
ALTER TABLE chords ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read chords
CREATE POLICY "Public chords are viewable by everyone" 
ON chords FOR SELECT 
USING (true);

-- Policy: Only admins/service_role can insert/update/delete (implied by default deny for others, but let's be explicit if needed, or just leave it open for reading only for now)
-- We will assume population is done via SQL Editor (service role)
