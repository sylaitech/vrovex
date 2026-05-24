import express from 'express';
import { auth } from '../middleware/auth.js';
import { supabase } from '../server.js';

const router = express.Router();

async function getUserShopIds(userId) {
  const { data, error } = await supabase
    .from('shops')
    .select('id')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return (data || []).map((shop) => shop.id);
}

router.get('/', auth, async (req, res) => {
  try {
    const { status = 'active', shopId } = req.query;
    const shopIds = shopId ? [shopId] : await getUserShopIds(req.userId);

    if (!shopIds.length) {
      return res.json([]);
    }

    let query = supabase.from('alerts').select('*').in('shop_id', shopIds);
    if (status === 'active') {
      query = query.eq('is_read', false);
    } else if (status === 'dismissed' || status === 'resolved') {
      query = query.eq('is_read', true);
    }

    const { data: alerts, error } = await query.order('created_at', { ascending: false }).limit(100);
    if (error) throw error;

    res.json(alerts || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:alertId', auth, async (req, res) => {
  try {
    const shopIds = await getUserShopIds(req.userId);
    const { data: alert, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', req.params.alertId)
      .single();

    if (error || !alert || !shopIds.includes(alert.shop_id)) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:alertId/dismiss', auth, async (req, res) => {
  try {
    const shopIds = await getUserShopIds(req.userId);
    const { data: alert, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', req.params.alertId)
      .single();

    if (error || !alert || !shopIds.includes(alert.shop_id)) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const { data, error: updateError } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', req.params.alertId)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:alertId/resolve', auth, async (req, res) => {
  try {
    const shopIds = await getUserShopIds(req.userId);
    const { data: alert, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', req.params.alertId)
      .single();

    if (error || !alert || !shopIds.includes(alert.shop_id)) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const { data, error: updateError } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', req.params.alertId)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const shopIds = await getUserShopIds(req.userId);

    if (!shopIds.length) {
      return res.json({ total: 0, active: 0, resolved: 0, dismissed: 0, byType: {}, byCategory: {} });
    }

    const now = new Date();
    let startDate;
    switch (period) {
      case '24h': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .in('shop_id', shopIds)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const list = alerts || [];
    const stats = {
      total: list.length,
      active: list.filter((a) => !a.is_read).length,
      resolved: list.filter((a) => a.is_read).length,
      dismissed: list.filter((a) => a.is_read).length,
      byType: {
        danger: list.filter((a) => a.alert_type === 'danger').length,
        warning: list.filter((a) => a.alert_type === 'warning').length,
        info: list.filter((a) => a.alert_type === 'info').length,
      },
      byCategory: list.reduce((acc, a) => {
        const category = a.data?.category || 'other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
