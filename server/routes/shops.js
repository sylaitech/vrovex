import express from 'express';
import crypto from 'crypto';
import { auth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/requireActivePlan.js';
import { getAuthorizationUrl, getAccessToken } from '../services/tiktok.js';
import { refreshShopMetrics } from '../services/monitoring.js';
import { scanShopCompliance } from '../utils/complianceScanner.js';
import { supabase } from '../server.js';
import logger from '../utils/logger.js';

// HMAC-signed OAuth state prevents CSRF on the TikTok callback
function createOAuthState(userId) {
  const payload = `${userId}.${Date.now()}`;
  const sig = crypto.createHmac('sha256', process.env.JWT_SECRET).update(payload).digest('hex').slice(0, 24);
  return `${payload}.${sig}`;
}

export function verifyOAuthState(state) {
  const parts = state?.split('.');
  if (!parts || parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  const payload = `${userId}.${ts}`;
  const expected = crypto.createHmac('sha256', process.env.JWT_SECRET).update(payload).digest('hex').slice(0, 24);
  // Constant-time compare to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  // Reject states older than 10 minutes
  if (Date.now() - Number(ts) > 10 * 60 * 1000) return null;
  return userId;
}

const router = express.Router();

const getShopById = async (shopId, userId) => {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }
  return data;
};

router.get('/', auth, async (req, res) => {
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', req.userId);

    if (error) {
      throw error;
    }

    res.json(shops || []);
  } catch (error) {
    logger.error('Shop route error:', error); res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/connect/url', auth, requireActivePlan, async (req, res) => {
  try {
    const state = createOAuthState(req.userId);
    const authUrl = getAuthorizationUrl(state);
    res.json({ authUrl, state });
  } catch (error) {
    logger.error('OAuth URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/connect', auth, requireActivePlan, async (req, res) => {
  try {
    const { authCode, shopName, region } = req.body;
    const tokenData = await getAccessToken(authCode);

    // Scope lookup to the authenticated user — prevents overwriting another user's shop tokens
    const { data: existingShop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('shop_id', tokenData.shopId)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (shopError) {
      throw shopError;
    }

    let shop;
    if (existingShop) {
      const updates = {
        tiktok_access_token: tokenData.accessToken,
        tiktok_refresh_token: tokenData.refreshToken,
        token_expires_at: new Date(Date.now() + tokenData.expiresIn * 1000).toISOString(),
        is_active: true,
      };
      const { data, error: updateError } = await supabase
        .from('shops')
        .update(updates)
        .eq('id', existingShop.id)
        .select()
        .single();
      if (updateError) throw updateError;
      shop = data;
    } else {
      const { data, error: insertError } = await supabase
        .from('shops')
        .insert({
          user_id: req.userId,
          shop_id: tokenData.shopId,
          shop_name: shopName || `Shop_${tokenData.shopId}`,
          region: region || 'US',
          tiktok_access_token: tokenData.accessToken,
          tiktok_refresh_token: tokenData.refreshToken,
          token_expires_at: new Date(Date.now() + tokenData.expiresIn * 1000).toISOString(),
          is_active: true,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      shop = data;
    }

    await supabase
      .from('users')
      .update({ tiktok_shop_connected: true })
      .eq('id', req.userId);

    await refreshShopMetrics(shop.id);

    res.status(201).json(shop);
  } catch (error) {
    logger.error('Shop route error:', error); res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:shopId', auth, async (req, res) => {
  try {
    const shop = await getShopById(req.params.shopId, req.userId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json(shop);
  } catch (error) {
    logger.error('Shop route error:', error); res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:shopId/refresh', auth, async (req, res) => {
  try {
    const shop = await getShopById(req.params.shopId, req.userId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    await refreshShopMetrics(shop.id);

    const updatedShop = await getShopById(shop.id, req.userId);
    res.json(updatedShop);
  } catch (error) {
    logger.error('Shop route error:', error); res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:shopId', auth, async (req, res) => {
  try {
    const shop = await getShopById(req.params.shopId, req.userId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const updates = {};
    const { shopName, region, isActive } = req.body;
    if (shopName) updates.shop_name = shopName;
    if (region) updates.region = region;
    if (typeof isActive === 'boolean') updates.is_active = isActive;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No shop fields to update' });
    }

    const { data, error } = await supabase
      .from('shops')
      .update(updates)
      .eq('id', shop.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    logger.error('Shop route error:', error); res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:shopId', auth, async (req, res) => {
  try {
    const shop = await getShopById(req.params.shopId, req.userId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { error: deleteError } = await supabase
      .from('shops')
      .delete()
      .eq('id', shop.id);

    if (deleteError) throw deleteError;

    const { data: remainingShops, error: countError } = await supabase
      .from('shops')
      .select('id')
      .eq('user_id', req.userId);
    if (countError) throw countError;

    if (!remainingShops || remainingShops.length === 0) {
      await supabase
        .from('users')
        .update({ tiktok_shop_connected: false })
        .eq('id', req.userId);
    }

    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    logger.error('Shop route error:', error); res.status(500).json({ error: 'Internal server error' });
  }
});

// Compliance Scanner Endpoint
router.post('/:shopId/scan-compliance', auth, async (req, res) => {
  try {
    const shop = await getShopById(req.params.shopId, req.userId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Execute compliance scan
    const scanResults = await scanShopCompliance(shop, supabase);

    // Store scan result in database for audit trail
    if (scanResults.totalIssues > 0 || scanResults.riskLevel > 0) {
      const { error: auditError } = await supabase
        .from('compliance_scans')
        .insert({
          shop_id: shop.id,
          user_id: req.userId,
          risk_level: scanResults.riskLevel,
          total_issues: scanResults.totalIssues,
          critical_issues: scanResults.criticalIssues,
          warning_issues: scanResults.warningIssues,
          scan_results: scanResults,
          status: scanResults.status
        });

      if (auditError) {
        console.error('Error storing compliance scan:', auditError);
        // Don't fail the response, just log it
      }
    }

    res.json(scanResults);
  } catch (error) {
    console.error('Compliance scan error:', error);
    res.status(500).json({ 
      error: error.message,
      status: 'error',
      riskLevel: 0,
      issues: []
    });
  }
});

export default router;
