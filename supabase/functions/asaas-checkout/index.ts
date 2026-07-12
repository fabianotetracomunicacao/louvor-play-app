import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') || '';
// Use sandbox URL for default testing, can be overridden in production
const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') || 'https://sandbox.asaas.com/api/v3';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Admin client to bypass RLS for DB inserts (securely in edge function)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { planId, churchId, type, customerData, paymentMethod, creditCard, creditCardHolderInfo } = await req.json()

    if (!planId || !type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 1. Fetch Plan Details
    const { data: plan, error: planError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      throw new Error('Plan not found')
    }

    if (plan.type !== type) {
      return new Response(JSON.stringify({ error: 'Plan type mismatch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let targetId = type === 'individual' ? user.id : churchId;

    // Security check: Verify if user has permission to manage church billing
    if (type === 'church') {
      const { data: membership } = await supabaseClient
        .from('church_user_memberships')
        .select('role')
        .eq('church_id', churchId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role !== 'super_admin' && membership?.role !== 'CHURCH_ADMIN') {
        return new Response(JSON.stringify({ error: 'Permission denied' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    }

    // Idempotency: prevent dual active subscriptions
    const { data: existingSub } = await supabaseClient
      .from('subscriptions')
      .select('id, status, asaas_subscription_id')
      .eq(type === 'individual' ? 'user_id' : 'church_id', targetId)
      .in('status', ['ACTIVE', 'PENDING', 'OVERDUE'])
      .maybeSingle();

    if (existingSub) {
      // Return existing subscription details
      const chargesRes = await fetch(`${ASAAS_API_URL}/payments?subscription=${existingSub.asaas_subscription_id}`, {
        headers: { 'access_token': ASAAS_API_KEY }
      });
      const chargesJson = await chargesRes.json();
      const firstCharge = chargesJson.data?.[0];
      
      const profileData = type === 'individual'
        ? await supabaseClient.from('profiles').select('asaas_customer_id').eq('id', targetId).single()
        : await supabaseClient.from('churches').select('asaas_customer_id').eq('id', targetId).single();
        
      const invoiceUrl = firstCharge?.invoiceUrl || `https://sandbox.asaas.com/c/${profileData.data?.asaas_customer_id || ''}`;
      
      let pixQrCode = null;
      if (firstCharge?.billingType === 'PIX' && (firstCharge?.status === 'PENDING' || firstCharge?.status === 'OVERDUE')) {
         const qrRes = await fetch(`${ASAAS_API_URL}/payments/${firstCharge.id}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
         });
         if (qrRes.ok) {
           const qrJson = await qrRes.json();
           pixQrCode = {
             encodedImage: qrJson.encodedImage,
             payload: qrJson.payload,
             expirationDate: qrJson.expirationDate
           };
         }
      }

      return new Response(JSON.stringify({ 
          subscriptionId: existingSub.id, 
          asaasSubscriptionId: existingSub.asaas_subscription_id,
          invoiceUrl: invoiceUrl,
          pixQrCode: pixQrCode,
          status: existingSub.status
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Fetch User/Church profile to see if Asaas Customer already exists
    let asaasCustomerId = null;

    if (type === 'individual') {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('asaas_customer_id, full_name, email')
        .eq('id', user.id)
        .single()
      
      asaasCustomerId = profile?.asaas_customer_id;
      if (!customerData.name) customerData.name = profile?.full_name;
      if (!customerData.email) customerData.email = profile?.email;
    } else {
      const { data: church } = await supabaseClient
        .from('churches')
        .select('asaas_customer_id, name')
        .eq('id', churchId)
        .single()
      
      asaasCustomerId = church?.asaas_customer_id;
      if (!customerData.name) customerData.name = church?.name;
    }

    // 3. Create Asaas Customer if Not Exists
    if (!asaasCustomerId) {
       // Only basic info required to create a customer in Asaas
       const customerPayload = {
         name: customerData.name,
         email: customerData.email,
         cpfCnpj: customerData.cpfCnpj || null, 
         phone: customerData.phone || null,
         mobilePhone: customerData.mobilePhone || null,
         postalCode: customerData.postalCode || null,
         addressNumber: customerData.addressNumber || null,
       };

       const customerRes = await fetch(`${ASAAS_API_URL}/customers`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'access_token': ASAAS_API_KEY
         },
         body: JSON.stringify(customerPayload)
       });

       const customerJson = await customerRes.json();
       if (!customerRes.ok) {
         console.error('Asaas Customer Error:', customerJson);
         throw new Error(customerJson.errors?.[0]?.description || 'Failed to create Asaas customer');
       }

       asaasCustomerId = customerJson.id;

       // Save back to DB using Admin client
       if (type === 'individual') {
         await supabaseAdmin.from('profiles').update({ asaas_customer_id: asaasCustomerId }).eq('id', user.id);
       } else {
         await supabaseAdmin.from('churches').update({ asaas_customer_id: asaasCustomerId }).eq('id', churchId);
       }
    }

    // 4. Create Asaas Subscription
    let validBillingType = 'UNDEFINED';
    if (paymentMethod === 'PIX') validBillingType = 'PIX';
    if (paymentMethod === 'CREDIT_CARD') validBillingType = 'CREDIT_CARD';

    const subscriptionPayload: any = {
      customer: asaasCustomerId,
      billingType: validBillingType,
      value: plan.price,
      nextDueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow usually, but for CC immediate it charges today if setup correctly or if we just charge now.
      cycle: plan.billing_cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
      description: `Assinatura: ${plan.name}`,
    };

    // If immediate Credit Card, Asaas handles the first charge synchronously if we pass CC details
    if (validBillingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
      subscriptionPayload.creditCard = creditCard;
      subscriptionPayload.creditCardHolderInfo = creditCardHolderInfo;
      // For immediate charge on subscription creation
      subscriptionPayload.nextDueDate = new Date().toISOString().split('T')[0]; 
    } else if (validBillingType === 'PIX') {
      // For PIX, we also want it to be due today so the user can pay immediately
      subscriptionPayload.nextDueDate = new Date().toISOString().split('T')[0];
    }

    const subRes = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify(subscriptionPayload)
    });

    const subJson = await subRes.json();
    if (!subRes.ok) {
       console.error('Asaas Subscription Error:', subJson);
       throw new Error(subJson.errors?.[0]?.description || 'Failed to create Asaas subscription');
    }

    let subStatus = 'PENDING';
    if (subJson.status === 'ACTIVE') { // Sometimes CC subscription activates immediately
        subStatus = 'ACTIVE';
    }

    // 5. Save Subscription in Supabase Database using Admin client
    const { data: dbSub, error: dbSubError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: type === 'individual' ? user.id : null,
        church_id: type === 'church' ? churchId : null,
        plan_id: plan.id,
        asaas_subscription_id: subJson.id,
        status: subStatus, // Initially PENDING or ACTIVE
        next_due_date: subJson.nextDueDate
      })
      .select()
      .single()

    if (dbSubError) {
      console.error('DB Insert Error:', dbSubError);
      throw new Error('Failed to save subscription in database');
    }

    // 6. Link Subscription UUID to Profile/Church using Admin client
    if (type === 'individual') {
        await supabaseAdmin.from('profiles').update({ subscription_id: dbSub.id }).eq('id', user.id);
    } else {
        await supabaseAdmin.from('churches').update({ subscription_id: dbSub.id }).eq('id', churchId);
    }

    // Fetch the charges for this subscription to get the payment URL or PIX code
    const chargesRes = await fetch(`${ASAAS_API_URL}/payments?subscription=${subJson.id}`, {
      headers: { 'access_token': ASAAS_API_KEY }
    });
    const chargesJson = await chargesRes.json();
    const firstCharge = chargesJson.data?.[0];
    const invoiceUrl = firstCharge?.invoiceUrl || `https://sandbox.asaas.com/c/${asaasCustomerId}`;

    // 7. If PIX, fetch the QR Code for the specific charge
    let pixQrCode = null;
    if (validBillingType === 'PIX' && firstCharge?.id) {
       const qrRes = await fetch(`${ASAAS_API_URL}/payments/${firstCharge.id}/pixQrCode`, {
         headers: { 'access_token': ASAAS_API_KEY }
       });
       if (qrRes.ok) {
         const qrJson = await qrRes.json();
         pixQrCode = {
           encodedImage: qrJson.encodedImage, // base64
           payload: qrJson.payload, // copia e cola
           expirationDate: qrJson.expirationDate
         };
       } else {
         console.error('Failed to generate PIX payload for charge', await qrRes.json());
       }
    }

    return new Response(
      JSON.stringify({ 
        subscriptionId: dbSub.id, 
        asaasSubscriptionId: subJson.id,
        invoiceUrl: invoiceUrl,
        pixQrCode: pixQrCode,
        status: dbSub.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Function Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
