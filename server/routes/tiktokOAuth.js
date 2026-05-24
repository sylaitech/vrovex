import express from 'express';
import { getAccessToken } from '../services/tiktok.js';
import { refreshShopMetrics } from '../services/monitoring.js';
import { supabase } from '../server.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * TikTok Shop OAuth callback (redirect from TikTok).
 * state format: userId_timestamp
 */
router.get('/callback', async (req, res) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${frontend}/?tiktok=error&reason=${encodeURIComponent(error)}`);
    }
    if (!code || !state) {
      return res.redirect(`${frontend}/?tiktok=error&reason=missing_params`);
    }

    const userId = String(state).split('_')[0];
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, plan_status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.redirect(`${frontend}/?tiktok=error&reason=invalid_user`);
    }

    if (user.plan_status !== 'active') {
      return res.redirect(`${frontend}/?tiktok=blocked&reason=subscription_required`);
    }

    const tokenData = await getAccessToken(code);

    const { data: existingShop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('shop_id', tokenData.shopId)
      .eq('user_id', userId)
      .maybeSingle();

    if (shopError) {
      throw shopError;
    }

    let shop;
    const shopPayload = {
      user_id: userId,
      shop_id: tokenData.shopId,
      shop_name: `TikTok Shop ${tokenData.shopId}`,
      region: 'US',
      tiktok_access_token: tokenData.accessToken,
      tiktok_refresh_token: tokenData.refreshToken,
      token_expires_at: new Date(Date.now() + tokenData.expiresIn * 1000).toISOString(),
      is_active: true,
    };

    if (existingShop) {
      const { data, error: updateError } = await supabase
        .from('shops')
        .update(shopPayload)
        .eq('id', existingShop.id)
        .select()
        .single();
      if (updateError) throw updateError;
      shop = data;
    } else {
      const { data, error: insertError } = await supabase
        .from('shops')
        .insert(shopPayload)
        .select()
        .single();
      if (insertError) throw insertError;
      shop = data;
    }

    await supabase
      .from('users')
      .update({ tiktok_shop_connected: true })
      .eq('id', userId);

    try {
      await refreshShopMetrics(shop.id);
      
      // Run full account scan (antivirus-style) on TikTok Shop connection
      const { sendComplianceScanReport } = await import('../services/notifications.js');
      const { scanAccountCompliance } = await import('../utils/complianceScanner.js');
      
      const fullAccountScan = await scanAccountCompliance(shop);
      logger.info(`✅ Full account scan completed for shop ${shop.shop_name}:`, fullAccountScan);
      
      // Send scan report to user
      const user = await supabase.from('users').select('email, name').eq('id', userId).single();
      if (user.data) {
        await sendComplianceScanReport(user.data, fullAccountScan, shop.shop_name);
      }
    } catch (e) {
      logger.warn('Initial metrics sync or account scan failed:', e.message);
    }

    res.redirect(`${frontend}/?tiktok=connected&shopId=${shop.id}`);
  } catch (err) {
    logger.error('TikTok OAuth callback:', err);
    res.redirect(`${frontend}/?tiktok=error&reason=server_error`);
  }
});

export default router;
