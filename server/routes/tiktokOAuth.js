import express from 'express';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import { getAccessToken } from '../services/tiktok.js';
import { refreshShopMetrics } from '../services/monitoring.js';
import { syncProfileToSupabase } from '../services/supabaseAdmin.js';
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
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect(`${frontend}/?tiktok=error&reason=invalid_user`);
    }

    if (user.planStatus !== 'active') {
      return res.redirect(`${frontend}/?tiktok=blocked&reason=subscription_required`);
    }

    const tokenData = await getAccessToken(code);

    let shop = await Shop.findOne({ shopId: tokenData.shopId, userId });
    if (shop) {
      shop.tiktokAccessToken = tokenData.accessToken;
      shop.tiktokRefreshToken = tokenData.refreshToken;
      shop.tokenExpiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);
      shop.isActive = true;
    } else {
      shop = new Shop({
        userId,
        shopId: tokenData.shopId,
        shopName: `TikTok Shop ${tokenData.shopId}`,
        region: 'US',
        tiktokAccessToken: tokenData.accessToken,
        tiktokRefreshToken: tokenData.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
      });
      await User.findByIdAndUpdate(userId, { $push: { shops: shop._id } });
    }
    await shop.save();

    user.tiktokShopConnected = true;
    await user.save();
    await syncProfileToSupabase(user);

    try {
      await refreshShopMetrics(shop._id);
    } catch (e) {
      logger.warn('Initial metrics sync failed:', e.message);
    }

    res.redirect(`${frontend}/?tiktok=connected&shopId=${shop._id}`);
  } catch (err) {
    logger.error('TikTok OAuth callback:', err);
    res.redirect(`${frontend}/?tiktok=error&reason=server_error`);
  }
});

export default router;
