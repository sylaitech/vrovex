import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/requireActivePlan.js';
import { supabase } from '../server.js';

const router = express.Router();

router.use(auth, requireActivePlan);

async function getShopForUser(shopId, userId) {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

router.get('/:shopId/current', async (req, res) => {
  try {
    const shop = await getShopForUser(req.params.shopId, req.userId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({
      shopId: shop.id,
      shopName: shop.shop_name,
      metrics: {
        accountHealth: shop.metrics_account_health,
        lateDispatchRate: shop.metrics_late_dispatch_rate,
        onTimeDeliveryRate: shop.metrics_on_time_delivery_rate,
        validTrackingRate: shop.metrics_valid_tracking_rate,
        shieldScore: shop.metrics_shield_score,
      },
      status: shop.status,
      lastSync: shop.last_sync,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:shopId/history', async (req, res) => {
  try {
    const shop = await getShopForUser(req.params.shopId, req.userId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { period = '7d' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const { data: history, error } = await supabase
      .from('metrics_history')
      .select('*')
      .eq('shop_id', shop.id)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;

    res.json(history || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', req.userId);

    if (error) throw error;

    const summary = (shops || []).map((shop) => ({
      shopId: shop.id,
      shopName: shop.shop_name,
      status: shop.status,
      metrics: {
        accountHealth: shop.metrics_account_health,
        lateDispatchRate: shop.metrics_late_dispatch_rate,
        onTimeDeliveryRate: shop.metrics_on_time_delivery_rate,
        validTrackingRate: shop.metrics_valid_tracking_rate,
        shieldScore: shop.metrics_shield_score,
      },
      lastSync: shop.last_sync,
    }));

    const totalShops = summary.length;
    const criticalShops = summary.filter((s) => s.status === 'critical').length;
    const warningShops = summary.filter((s) => s.status === 'warning').length;
    const healthyShops = summary.filter((s) => s.status === 'healthy').length;

    res.json({
      summary,
      stats: {
        totalShops,
        criticalShops,
        warningShops,
        healthyShops,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
