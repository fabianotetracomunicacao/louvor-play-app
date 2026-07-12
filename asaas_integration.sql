-- SaaS Asaas Integration: Subscription Management Structure

-- 1. Updates to Plans Table
-- Add fields to differentiate between individual and church plans, and billing cycles
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('individual', 'church')) DEFAULT 'church';
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS billing_cycle TEXT CHECK (billing_cycle IN ('MONTHLY', 'YEARLY')) DEFAULT 'MONTHLY';
-- Since individual plans won't use leader/worshiper limits in the same way, we make sure they can be 0.
-- Update existing plans to be type 'church' and cycle 'MONTHLY' (which is the default).

-- 2. Updates to Churches Table
-- Add field to store the Asaas Customer ID for the church entity
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;

-- 3. Updates to Profiles Table
-- Add fields for individual SaaS users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;

-- 4. Subscriptions Table
-- This table tracks the active subscriptions mapped to Asaas.
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- For individual plans
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE, -- For church plans
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    asaas_subscription_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE', 'PENDING', 'OVERDUE', 'EXPIRED', 'CANCELED')),
    next_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Ensure a subscription belongs to EITHER a user OR a church, not both or neither
    CONSTRAINT chk_subscription_owner CHECK (
        (user_id IS NOT NULL AND church_id IS NULL) OR 
        (user_id IS NULL AND church_id IS NOT NULL)
    )
);

-- Note: We also need a way to link the profile/church quickly to its active subscription 
-- but we can query the subscriptions table sorted by created_at or updated_at.
-- For convenience, let's add a subscription_id to profiles and churches.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id);
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id);

-- 5. RLS Configuration for Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Super Admin can see and manage all subscriptions
CREATE POLICY super_admin_all_subscriptions ON public.subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Users can see their own individual subscriptions
CREATE POLICY view_own_subscription ON public.subscriptions FOR SELECT USING (
    user_id = auth.uid()
);

-- Church Admins can see their church's subscriptions
CREATE POLICY view_church_subscription ON public.subscriptions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM church_user_memberships 
        WHERE church_id = subscriptions.church_id 
        AND user_id = auth.uid() 
        AND role = 'CHURCH_ADMIN'
    )
);

-- 6. Trigger to automatically update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
