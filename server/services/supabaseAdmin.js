/**
 * Sincroniza perfiles Mongo → Supabase cuando hay service role configurado.
 */
import logger from '../utils/logger.js';

let supabase = null;

async function getClient() {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(url, key, { auth: { persistSession: false } });
    return supabase;
  } catch {
    logger.warn('Supabase client not available — install @supabase/supabase-js on server');
    return null;
  }
}

export async function syncProfileToSupabase(profile) {
  const client = await getClient();
  if (!client || !profile.supabaseId) return;

  const { error } = await client.from('profiles').upsert({
    id: profile.supabaseId,
    email: profile.email,
    plan_status: profile.planStatus,
    current_period_end: profile.currentPeriodEnd?.toISOString() ?? null,
    tiktok_shop_connected: profile.tiktokShopConnected,
    stripe_customer_id: profile.stripeCustomerId,
    stripe_subscription_id: profile.stripeSubscriptionId,
    locale: profile.locale || 'es',
    updated_at: new Date().toISOString(),
  });

  if (error) logger.error('Supabase profile sync failed:', error.message);
}
