-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id),
    asaas_subscription_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    next_due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure a subscription belongs to EITHER a user OR a church, not both
-- Check if constraint exists before adding
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_user_or_church' AND table_name = 'subscriptions') THEN
        ALTER TABLE public.subscriptions ADD CONSTRAINT check_user_or_church CHECK (
            (user_id IS NOT NULL AND church_id IS NULL) OR 
            (user_id IS NULL AND church_id IS NOT NULL)
        );
    END IF;
END $$;

-- Alter profiles table safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='asaas_customer_id') THEN
        ALTER TABLE public.profiles ADD COLUMN asaas_customer_id TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='subscription_id') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Alter churches table safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='churches' AND column_name='asaas_customer_id') THEN
        ALTER TABLE public.churches ADD COLUMN asaas_customer_id TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='churches' AND column_name='subscription_id') THEN
        ALTER TABLE public.churches ADD COLUMN subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Alter plans table safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='type') THEN
        ALTER TABLE public.plans ADD COLUMN type TEXT DEFAULT 'individual';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='billing_cycle') THEN
        ALTER TABLE public.plans ADD COLUMN billing_cycle TEXT DEFAULT 'YEARLY';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create Policies for subscriptions safely (Drop if exists then create)
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions" 
    ON public.subscriptions FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Church members can view church subscriptions" ON public.subscriptions;
CREATE POLICY "Church members can view church subscriptions" 
    ON public.subscriptions FOR SELECT 
    USING (
        church_id IN (
            SELECT church_id FROM public.church_user_memberships WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Super admins can view all subscriptions"
    ON public.subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

