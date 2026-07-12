-- SaaS Multi-tenant Transformation: Church Management Structure

-- 1. Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    leader_limit INTEGER NOT NULL DEFAULT 1,
    worshiper_limit INTEGER NOT NULL DEFAULT 5,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Churches Table
CREATE TABLE IF NOT EXISTS public.churches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    trade_name TEXT,
    cnpj TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    district TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Brasil',
    zip_code TEXT,
    plan_id UUID REFERENCES public.plans(id),
    extra_leader_slots INTEGER DEFAULT 0,
    extra_worshiper_slots INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'canceled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update Profiles for Global Role
-- Add 'super_admin' to the existing roles if not already handled
-- We'll also add active_church_id as a hint for the last church visited
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_church_id UUID REFERENCES public.churches(id);

-- 4. Church User Memberships (N-to-N Relationship)
CREATE TABLE IF NOT EXISTS public.church_user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('CHURCH_ADMIN', 'WORSHIP_LEADER', 'WORSHIPPER')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    invited_by_user_id UUID REFERENCES public.profiles(id),
    invitation_id UUID, -- Optional link to invitation record
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(church_id, user_id)
);

-- 5. Invitations Table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('CHURCH_ADMIN', 'WORSHIP_LEADER', 'WORSHIPPER')),
    token TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),
    expires_at TIMESTAMPTZ NOT NULL,
    invited_by_user_id UUID REFERENCES public.profiles(id),
    accepted_by_user_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Indices for Performance
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.church_user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_church ON public.church_user_memberships(church_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- 7. RLS Configuration (Initial)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Super Admin Policy (Access Everything)
-- We assume profiles.role = 'super_admin' for the platform owner
CREATE POLICY super_admin_all_plans ON public.plans FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY super_admin_all_churches ON public.churches FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY super_admin_all_memberships ON public.church_user_memberships FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY super_admin_all_invitations ON public.invitations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Plan Policy (Public Read for Active Plans)
CREATE POLICY active_plans_read ON public.plans FOR SELECT USING (active = true);

-- Church Policies
-- Users can see churches they are members of
CREATE POLICY member_view_church ON public.churches FOR SELECT USING (
    EXISTS (SELECT 1 FROM church_user_memberships WHERE church_id = churches.id AND user_id = auth.uid())
);

-- Church Responsible (CHURCH_ADMIN) can edit their church
CREATE POLICY admin_edit_church ON public.churches FOR UPDATE USING (
    EXISTS (SELECT 1 FROM church_user_memberships WHERE church_id = churches.id AND user_id = auth.uid() AND role = 'CHURCH_ADMIN')
);

-- Membership Policies
CREATE POLICY view_my_memberships ON public.church_user_memberships FOR SELECT USING (user_id = auth.uid());
CREATE POLICY admin_manage_church_memberships ON public.church_user_memberships FOR ALL USING (
    EXISTS (SELECT 1 FROM church_user_memberships m WHERE m.church_id = church_user_memberships.church_id AND m.user_id = auth.uid() AND m.role = 'CHURCH_ADMIN')
);

-- Invitation Policies
CREATE POLICY admin_manage_invitations ON public.invitations FOR ALL USING (
    EXISTS (SELECT 1 FROM church_user_memberships WHERE church_id = invitations.church_id AND user_id = auth.uid() AND role = 'CHURCH_ADMIN')
);

-- 8. Seed Default Plans
INSERT INTO public.plans (name, leader_limit, worshiper_limit, description) VALUES
('Pequeno', 1, 5, 'Ideal para grupos pequenos'),
('Médio', 2, 12, 'Para ministérios em crescimento'),
('Grande', 5, 30, 'Para grandes comunidades');
