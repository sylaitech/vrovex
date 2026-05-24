import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { isStaffRole } from '../utils/creator.js';
import { supabase } from '../server.js';

const router = express.Router();

router.use(auth, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const [{ count: total }, { count: active }, { count: inactive }, { count: canceled }, { count: tiktokConnected }, { count: shopCount }, { count: staff }] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('plan_status', 'active'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('plan_status', 'inactive'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('plan_status', 'canceled'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('tiktok_shop_connected', true),
      supabase.from('shops').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).in('role', ['admin', 'creator']),
    ]);

    res.json({
      users: { total, active, inactive, canceled, staff },
      tiktokConnected,
      shopCount,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { q, planStatus, limit = 50 } = req.query;
    let query = supabase.from('users').select('id, email, name, role, plan_status, current_period_end, tiktok_shop_connected, stripe_customer_id, created_at, last_login');

    if (planStatus) {
      query = query.eq('plan_status', planStatus);
    }

    if (q) {
      const like = `%${q}%`;
      query = query.or(`email.ilike.${like},name.ilike.${like}`);
    }

    const maxLimit = Math.min(Number(limit) || 50, 200);
    const { data: users, error } = await query.order('created_at', { ascending: false }).limit(maxLimit);
    if (error) throw error;

    const { data: shopRows, error: shopError } = await supabase.from('shops').select('user_id');
    if (shopError) throw shopError;

    const shopMap = (shopRows || []).reduce((acc, shop) => {
      acc[shop.user_id] = (acc[shop.user_id] || 0) + 1;
      return acc;
    }, {});

    res.json({
      users: (users || []).map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        planStatus: u.plan_status,
        currentPeriodEnd: u.current_period_end,
        tiktokShopConnected: u.tiktok_shop_connected,
        stripeCustomerId: u.stripe_customer_id ? '•••' : null,
        shopCount: shopMap[u.id] || 0,
        createdAt: u.created_at,
        lastLogin: u.last_login,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:userId', async (req, res) => {
  try {
    const { data: target, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, plan_status, current_period_end, tiktok_shop_connected')
      .eq('id', req.params.userId)
      .single();

    if (userError || !target) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { planStatus, currentPeriodEnd, role, extendDays } = req.body;
    const updates = {};

    if (planStatus && ['active', 'inactive', 'canceled'].includes(planStatus)) {
      updates.plan_status = planStatus;
    }

    if (extendDays && Number(extendDays) > 0) {
      const base = target.current_period_end && new Date(target.current_period_end) > new Date()
        ? new Date(target.current_period_end)
        : new Date();
      base.setDate(base.getDate() + Number(extendDays));
      updates.current_period_end = base.toISOString();
      updates.plan_status = 'active';
    }

    if (currentPeriodEnd !== undefined) {
      updates.current_period_end = currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : null;
    }

    if (role && ['user', 'creator', 'admin'].includes(role)) {
      if (target.id === req.user.id && !isStaffRole(role)) {
        return res.status(400).json({ error: 'Cannot remove your own staff access' });
      }
      updates.role = role;
      if (isStaffRole(role)) {
        updates.plan_status = 'active';
        if (!updates.current_period_end && !target.current_period_end) {
          const far = new Date();
          far.setFullYear(far.getFullYear() + 10);
          updates.current_period_end = far.toISOString();
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.userId)
      .select()
      .single();

    if (updateError || !updatedUser) {
      throw updateError || new Error('Failed to update user');
    }

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      planStatus: updatedUser.plan_status,
      currentPeriodEnd: updatedUser.current_period_end,
      tiktokShopConnected: updatedUser.tiktok_shop_connected,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
