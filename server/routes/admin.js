import express from 'express';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import { auth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { isStaffRole } from '../utils/creator.js';

const router = express.Router();

router.use(auth, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const [total, active, inactive, canceled, tiktokConnected, shopCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ planStatus: 'active' }),
      User.countDocuments({ planStatus: 'inactive' }),
      User.countDocuments({ planStatus: 'canceled' }),
      User.countDocuments({ tiktokShopConnected: true }),
      Shop.countDocuments(),
    ]);

    const staff = await User.countDocuments({ role: { $in: ['admin', 'creator'] } });

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
    const filter = {};
    if (planStatus) filter.planStatus = planStatus;
    if (q) {
      filter.$or = [
        { email: new RegExp(q, 'i') },
        { name: new RegExp(q, 'i') },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200))
      .lean();

    const shopCounts = await Shop.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    const shopMap = Object.fromEntries(shopCounts.map((s) => [String(s._id), s.count]));

    res.json({
      users: users.map((u) => ({
        id: u._id,
        email: u.email,
        name: u.name,
        role: u.role,
        planStatus: u.planStatus,
        currentPeriodEnd: u.currentPeriodEnd,
        tiktokShopConnected: u.tiktokShopConnected,
        stripeCustomerId: u.stripeCustomerId ? '•••' : null,
        shopCount: shopMap[String(u._id)] || 0,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:userId', async (req, res) => {
  try {
    const target = await User.findById(req.params.userId);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { planStatus, currentPeriodEnd, role, extendDays } = req.body;

    if (planStatus && ['active', 'inactive', 'canceled'].includes(planStatus)) {
      target.planStatus = planStatus;
    }

    if (extendDays && Number(extendDays) > 0) {
      const base = target.currentPeriodEnd && new Date(target.currentPeriodEnd) > new Date()
        ? new Date(target.currentPeriodEnd)
        : new Date();
      base.setDate(base.getDate() + Number(extendDays));
      target.currentPeriodEnd = base;
      target.planStatus = 'active';
    }

    if (currentPeriodEnd !== undefined) {
      target.currentPeriodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
    }

    if (role && ['user', 'creator', 'admin'].includes(role)) {
      if (target._id.equals(req.user._id) && !isStaffRole(role)) {
        return res.status(400).json({ error: 'Cannot remove your own staff access' });
      }
      target.role = role;
      if (isStaffRole(role)) {
        target.planStatus = 'active';
        if (!target.currentPeriodEnd) {
          const far = new Date();
          far.setFullYear(far.getFullYear() + 10);
          target.currentPeriodEnd = far;
        }
      }
    }

    await target.save();

    res.json({
      id: target._id,
      email: target.email,
      name: target.name,
      role: target.role,
      planStatus: target.planStatus,
      currentPeriodEnd: target.currentPeriodEnd,
      tiktokShopConnected: target.tiktokShopConnected,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
