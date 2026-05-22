import express from 'express';
import Appeal from '../models/Appeal.js';
import Shop from '../models/Shop.js';
import { auth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/requireActivePlan.js';
import { generateAppealContent } from '../utils/appealGenerator.js';
import { submitAppeal } from '../services/tiktok.js';

const router = express.Router();

router.use(auth, requireActivePlan);

// Get all appeals for user
router.get('/', auth, async (req, res) => {
  try {
    const { shopId, status } = req.query;
    
    const query = { userId: req.userId };
    
    if (shopId) query.shopId = shopId;
    if (status) query.status = status;
    
    const appeals = await Appeal.find(query)
      .populate('shopId', 'shopName')
      .sort({ createdAt: -1 });
    
    res.json(appeals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate appeal
router.post('/generate', auth, async (req, res) => {
  try {
    const { shopId, category, customData } = req.body;
    
    const shop = await Shop.findOne({
      _id: shopId,
      userId: req.userId
    });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    const content = generateAppealContent(category, shop, customData);
    
    const appeal = new Appeal({
      shopId: shop._id,
      userId: req.userId,
      category,
      generatedContent: content,
      status: 'draft'
    });
    
    await appeal.save();
    
    res.status(201).json(appeal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit appeal to TikTok
router.post('/:appealId/submit', auth, async (req, res) => {
  try {
    const appeal = await Appeal.findOne({
      _id: req.params.appealId,
      userId: req.userId
    }).populate('shopId');
    
    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }
    
    if (appeal.status !== 'draft') {
      return res.status(400).json({ error: 'Appeal already submitted' });
    }
    
    // Submit to TikTok
    const result = await submitAppeal(
      appeal.shopId.tiktokAccessToken,
      appeal.shopId.shopId,
      {
        category: appeal.category,
        content: appeal.generatedContent
      }
    );
    
    appeal.status = 'submitted';
    appeal.submittedAt = new Date();
    appeal.tiktokCaseId = result.case_id;
    await appeal.save();
    
    res.json(appeal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appeal
router.patch('/:appealId', auth, async (req, res) => {
  try {
    const appeal = await Appeal.findOne({
      _id: req.params.appealId,
      userId: req.userId
    });
    
    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }
    
    const { generatedContent, notes, status } = req.body;
    
    if (generatedContent) appeal.generatedContent = generatedContent;
    if (notes) appeal.notes = notes;
    if (status) appeal.status = status;
    
    await appeal.save();
    res.json(appeal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete appeal
router.delete('/:appealId', auth, async (req, res) => {
  try {
    const appeal = await Appeal.findOneAndDelete({
      _id: req.params.appealId,
      userId: req.userId
    });
    
    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }
    
    res.json({ message: 'Appeal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
