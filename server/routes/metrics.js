import express from 'express';
import Shop from '../models/Shop.js';
import MetricsHistory from '../models/MetricsHistory.js';
import { auth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/requireActivePlan.js';

const router = express.Router();

router.use(auth, requireActivePlan);

// Get current metrics for a shop
router.get('/:shopId/current', async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.shopId,
      userId: req.userId
    });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json({
      shopId: shop._id,
      shopName: shop.shopName,
      metrics: shop.metrics,
      status: shop.status,
      lastSync: shop.lastSync
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get metrics history
router.get('/:shopId/history', async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.shopId,
      userId: req.userId
    });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    const { period = '7d' } = req.query;
    
    // Calculate date range
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
      case '90d':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
    
    const history = await MetricsHistory.find({
      shopId: shop._id,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get metrics summary for all shops
router.get('/summary', async (req, res) => {
  try {
    const shops = await Shop.find({ userId: req.userId });
    
    const summary = shops.map(shop => ({
      shopId: shop._id,
      shopName: shop.shopName,
      status: shop.status,
      metrics: shop.metrics,
      lastSync: shop.lastSync
    }));
    
    // Calculate overall stats
    const totalShops = shops.length;
    const criticalShops = shops.filter(s => s.status === 'critical').length;
    const warningShops = shops.filter(s => s.status === 'warning').length;
    const healthyShops = shops.filter(s => s.status === 'healthy').length;
    
    res.json({
      summary,
      stats: {
        totalShops,
        criticalShops,
        warningShops,
        healthyShops
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
