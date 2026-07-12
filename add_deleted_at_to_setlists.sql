-- Add deleted_at column to setlists for soft delete support
ALTER TABLE setlists ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Optional: Index for performance since we query it often
CREATE INDEX IF NOT EXISTS setlists_deleted_at_idx ON setlists (deleted_at);
