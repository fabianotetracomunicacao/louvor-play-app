-- Migration: Enable RLS and add policies for user_activity_logs
-- Date: 2026-04-01

-- 1. Enable Row Level Security
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Users can insert their own logs
-- Required for the frontend logActivity system in storage.js
CREATE POLICY "Users can insert their own activity logs"
ON public.user_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Policy: Users can view their own logs
CREATE POLICY "Users can view their own activity logs"
ON public.user_activity_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Policy: Admins/Super Admins can manage all logs
CREATE POLICY "Admins can manage all activity logs"
ON public.user_activity_logs
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
    )
);
