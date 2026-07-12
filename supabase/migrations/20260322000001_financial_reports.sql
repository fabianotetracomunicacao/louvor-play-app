-- 1. Add custom_price to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS custom_price DECIMAL(10,2);
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS manual_override BOOLEAN DEFAULT false; -- To flag courtesy/manual plans without Asaas

-- 2. RPC to get MRR (Monthly Recurring Revenue)
CREATE OR REPLACE FUNCTION get_financial_mrr()
RETURNS NUMERIC AS $$
DECLARE
    total_mrr NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(
        CASE
            WHEN p.billing_cycle = 'YEARLY' THEN COALESCE(s.custom_price, p.price) / 12.0
            ELSE COALESCE(s.custom_price, p.price)
        END
    ), 0) INTO total_mrr
    FROM public.subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.status = 'ACTIVE';

    RETURN total_mrr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC to get ARR (Annual Recurring Revenue)
CREATE OR REPLACE FUNCTION get_financial_arr()
RETURNS NUMERIC AS $$
DECLARE
    total_arr NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(
        CASE
            WHEN p.billing_cycle = 'MONTHLY' THEN COALESCE(s.custom_price, p.price) * 12.0
            ELSE COALESCE(s.custom_price, p.price)
        END
    ), 0) INTO total_arr
    FROM public.subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.status = 'ACTIVE';

    RETURN total_arr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC to get sub counts by status
CREATE OR REPLACE FUNCTION get_subscriptions_by_status()
RETURNS TABLE (sub_status TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.status AS sub_status, COUNT(*) AS count
    FROM public.subscriptions s
    GROUP BY s.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
