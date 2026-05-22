import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/requireActivePlan.js';
import { scanProductCompliance } from '../utils/complianceScanner.js';

const router = express.Router();

router.use(auth, requireActivePlan);

// Scan product text for compliance issues
router.post('/scan', auth, async (req, res) => {
  try {
    const { text, productData } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const result = scanProductCompliance(text, productData);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch scan multiple products
router.post('/scan/batch', auth, async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required' });
    }
    
    const results = products.map(product => ({
      productId: product.id,
      ...scanProductCompliance(product.text, product)
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance rules
router.get('/rules', auth, async (req, res) => {
  try {
    const rules = {
      prohibitedKeywords: [
        'replica', 'fake', 'counterfeit', 'knockoff',
        'cure', 'treat', 'diagnose', 'prevent disease',
        'guaranteed results', '100% effective',
        'miracle', 'magic', 'instant results'
      ],
      restrictedCategories: [
        'supplements', 'medicine', 'medical devices',
        'branded items', 'designer goods',
        'weapons', 'tobacco', 'alcohol'
      ],
      requiredCertifications: {
        supplements: ['FDA registration', 'GMP certificate'],
        electronics: ['CE marking', 'FCC certification'],
        cosmetics: ['Safety assessment', 'Ingredient list']
      }
    };
    
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
