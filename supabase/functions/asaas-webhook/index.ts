import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

// Asaas Webhook Secret for validation
const ASAAS_WEBHOOK_SECRET = Deno.env.get('ASAAS_WEBHOOK_SECRET') || '';

serve(async (req) => {
  try {
    // 1. Validate Webhook Origin (Optional but recommended for security)
    // Asaas sends a 'asaas-access-token' header if configured in the panel
    const asaasToken = req.headers.get('asaas-access-token');
    
    // If you configure a token in Asaas, validate it here STRICTLY
    if (!ASAAS_WEBHOOK_SECRET || asaasToken !== ASAAS_WEBHOOK_SECRET) {
      console.warn('Invalid or missing Asaas access token / Secret not configured');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse the webhook payload
    const payload = await req.json();
    console.log('Webhook received:', payload.event, payload.payment?.id || payload.subscription?.id);

    // We only care about specific events
    const event = payload.event;
    
    // Service Role key is required to bypass RLS and update subscriptions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Depending on the event, we update the subscription status
    // Events usually revolve around payments or the subscription itself
    
    let dbStatus = null;
    let subscriptionId = null;

    if (event.startsWith('PAYMENT_')) {
      subscriptionId = payload.payment?.subscription;
      
      switch (event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          dbStatus = 'ACTIVE';
          break;
        case 'PAYMENT_OVERDUE':
          dbStatus = 'OVERDUE';
          break;
        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED':
        case 'PAYMENT_CHARGEBACK_REQUESTED':
          dbStatus = 'CANCELED';
          break;
        default:
          // Ignore other payment events
          return new Response('Event ignored', { status: 200 });
      }
    } else if (event.startsWith('SUBSCRIPTION_')) {
        subscriptionId = payload.subscription?.id;
        
        switch (event) {
            case 'SUBSCRIPTION_CREATED':
                // Handled during checkout, but good to ensure
                break;
            case 'SUBSCRIPTION_UPDATE':
                // Might need to update values/limits
                break;
            case 'SUBSCRIPTION_DELETED':
                dbStatus = 'CANCELED';
                break;
             default:
                return new Response('Event ignored', { status: 200 });
        }
    } else {
        return new Response('Event ignored', { status: 200 });
    }

    if (subscriptionId && dbStatus) {
        // Find and update the subscription in our database
        const { data: sub, error: updateError } = await supabaseClient
            .from('subscriptions')
            .update({ status: dbStatus })
            .eq('asaas_subscription_id', subscriptionId)
            .select()
            .single();

        if (updateError) {
            console.error('Failed to update subscription:', updateError);
            return new Response('Internal Server Error', { status: 500 });
        }
        
        console.log(`Subscription ${subscriptionId} updated to ${dbStatus}`);
        
        // Example: If a church is canceled/overdue, we could run extra logic here
        // to forcefully kick users out or expire their tokens, though the frontend
        // AuthContext middleware will cleanly block access if the status gets updated here.
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
