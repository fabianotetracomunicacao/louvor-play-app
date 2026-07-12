-- Security & Performance Enhancement: Add subscription_status directly to profiles and churches
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'PENDING';
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'PENDING';

-- Create a function to sync subscription status from the subscriptions table
CREATE OR REPLACE FUNCTION sync_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        UPDATE public.profiles SET subscription_status = NEW.status WHERE id = NEW.user_id;
    END IF;
    
    IF NEW.church_id IS NOT NULL THEN
        UPDATE public.churches SET subscription_status = NEW.status WHERE id = NEW.church_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on subscriptions to fire the sync function automatically
DROP TRIGGER IF EXISTS trigger_sync_subscription_status ON public.subscriptions;
CREATE TRIGGER trigger_sync_subscription_status
AFTER INSERT OR UPDATE OF status
ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_subscription_status();

-- Backfill or Sync existing data just in case
UPDATE public.profiles p
SET subscription_status = s.status
FROM public.subscriptions s
WHERE p.id = s.user_id;

UPDATE public.churches c
SET subscription_status = s.status
FROM public.subscriptions s
WHERE c.id = s.church_id;
