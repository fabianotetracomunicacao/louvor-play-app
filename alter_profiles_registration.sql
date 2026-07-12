-- Add new columns for user registration data
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS church TEXT,
ADD COLUMN IF NOT EXISTS favorite_style TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Allow users to update their own profile (Policy check)
-- Existing policies likely cover this, but ensuring update capability is good.
-- We will rely on existing RLS for "Users can update own profile".
