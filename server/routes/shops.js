import express from 'express';
import Shop from '../models/Shop.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/requireActivePlan.js';
import { getAuthorizationUrl, getAccessToken, getShopMetrics } from '../services/tiktok.js';
import { refreshShopMetrics } from '../services/monitoring.js';

const router = express.Router();

// Get all user shops
router.get('/', auth, async (req, res) => {
  try {
    const shops = await Shop.find({ userId: req.userId });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single shop
router.get('/:shopId', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.shopId,
      userId: req.userId
    });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get TikTok authorization URL
router.get('/connect/url', auth, requireActivePlan, async (req, res) => {
  try {
    const state = `${req.userId}_${Date.now()}`;
    const authUrl = getAuthorizationUrl(state);
    
    res.json({ authUrl, state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect TikTok Shop (OAuth callback)
router.post('/connect', auth, requireActivePlan, async (req, res) => {
  try {
    const { authCode, shopName, region } = req.body;
    
    // Exchange auth code for tokens
    const tokenData = await getAccessToken(authCode);
    
    // Check if shop already exists
    let shop = await Shop.findOne({ shopId: tokenData.shopId });
    
    if (shop) {
      // Update existing shop
      shop.tiktokAccessToken = tokenData.accessToken;
      shop.tiktokRefreshToken = tokenData.refreshToken;
      shop.tokenExpiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);
      shop.isActive = true;
    } else {
      // Create new shop
      shop = new Shop({
        userId: req.userId,
        shopId: tokenData.shopId,
        shopName: shopName || `Shop_${tokenData.shopId}`,
        region: region || 'US',
        tiktokAccessToken: tokenData.accessToken,
        tiktokRefreshToken: tokenData.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000)
      });
      
      // Add shop to user
      await User.findByIdAndUpdate(req.userId, {
        $push: { shops: shop._id }
      });
    }
    
    await shop.save();

    await User.findByIdAndUpdate(req.userId, { tiktokShopConnected: true });
    
    // Fetch initial metrics
    await refreshShopMetrics(shop._id);
    
    res.status(201).json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh shop metrics manually
router.post('/:shopId/refresh', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.shopId,
      userId: req.userId
    });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    await refreshShopMetrics(shop._id);
    
    const updatedShop = await Shop.findById(shop._id);
    res.json(updatedShop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update shop settings
router.patch('/:shopId', auth, async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.shopId,
      userId: req.userId
    });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    const { shopName, region, isActive } = req.body;
    
    if (shopName) shop.shopName = shopName;
    if (region) shop.region = region;
    if (typeof isActive === 'boolean') shop.isActive = isActive;
    
    await shop.save();
    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete shop
router.delete('/:shopId', auth, async (req, res) => {
  try {
    const shop = await Shop.findOneAndDelete({
      _id: req.params.shopId,
      userId: req.userId
    });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    // Remove from user
    await User.findByIdAndUpdate(req.userId, {
      $pull: { shops: shop._id }
    });
    
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
