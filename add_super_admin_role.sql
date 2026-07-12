-- 1. ADD 'super_admin' AND 'user' TO user_role ENUM
-- Note: 'ALTER TYPE ... ADD VALUE' cannot be run inside a transaction.
-- If this fails with the enum already having the value, it's fine.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'user';

-- 2. PROMOTE USER TO SUPER ADMIN
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'fabiano_fischer@hotmail.com';

-- 3. (Optional) Create a default plan and church for testing if not exists
INSERT INTO public.plans (name, leader_limit, worshiper_limit, description) 
SELECT 'Pequeno', 1, 5, 'Ideal para grupos pequenos'
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Pequeno');

INSERT INTO public.churches (name, plan_id, status)
SELECT 'Igreja Sede', (SELECT id FROM public.plans LIMIT 1), 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.churches WHERE name = 'Igreja Sede');

-- 4. LINK USER TO THE CHURCH AS ADMIN
INSERT INTO public.church_user_memberships (church_id, user_id, role, status)
SELECT (SELECT id FROM public.churches LIMIT 1), (SELECT id FROM public.profiles WHERE email = 'fabiano_fischer@hotmail.com'), 'CHURCH_ADMIN', 'active'
WHERE NOT EXISTS (
    SELECT 1 FROM public.church_user_memberships 
    WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'fabiano_fischer@hotmail.com')
);
