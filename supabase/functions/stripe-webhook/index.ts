/**
 * Supabase Edge Function (opcional) — mismo flujo que server/routes/webhooks.js
 * Despliega con: supabase functions deploy stripe-webhook
 * Configura STRIPE_WEBHOOK_SECRET y SUPABASE_SERVICE_ROLE_KEY en secrets.
 */
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-11-20.acacia' });

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  const event = stripe.webhooks.constructEvent(body, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as { metadata?: { userId?: string }; current_period_end?: number };
    const userId = sub.metadata?.userId;
    if (userId) {
      await supabase.from('profiles').update({
        plan_status: 'active',
        current_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 86400000).toISOString(),
      }).eq('id', userId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as { metadata?: { userId?: string } };
    if (sub.metadata?.userId) {
      await supabase.from('profiles').update({ plan_status: 'inactive' }).eq('id', sub.metadata.userId);
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
