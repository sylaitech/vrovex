import express from 'express';
import Alert from '../models/Alert.js';
import Shop from '../models/Shop.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all alerts for user
router.get('/', auth, async (req, res) => {
  try {
    const { status = 'active', shopId } = req.query;
    
    const query = { userId: req.userId };
    
    if (status) {
      query.status = status;
    }
    
    if (shopId) {
      query.shopId = shopId;
    }
    
    const alerts = await Alert.find(query)
      .populate('shopId', 'shopName')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single alert
router.get('/:alertId', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.alertId,
      userId: req.userId
    }).populate('shopId', 'shopName');
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dismiss alert
router.patch('/:alertId/dismiss', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.alertId,
      userId: req.userId
    });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.status = 'dismissed';
    await alert.save();
    
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve alert
router.patch('/:alertId/resolve', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.alertId,
      userId: req.userId
    });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    await alert.save();
    
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alert statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '24h':
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
    
    const alerts = await Alert.find({
      userId: req.userId,
      createdAt: { $gte: startDate }
    });
    
    const stats = {
      total: alerts.length,
      active: alerts.filter(a => a.status === 'active').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      dismissed: alerts.filter(a => a.status === 'dismissed').length,
      byType: {
        danger: alerts.filter(a => a.type === 'danger').length,
        warning: alerts.filter(a => a.type === 'warning').length,
        info: alerts.filter(a => a.type === 'info').length
      },
      byCategory: {
        late_dispatch: alerts.filter(a => a.category === 'late_dispatch').length,
        account_health: alerts.filter(a => a.category === 'account_health').length,
        vtr: alerts.filter(a => a.category === 'vtr').length,
        compliance: alerts.filter(a => a.category === 'compliance').length,
        other: alerts.filter(a => a.category === 'other').length
      }
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
