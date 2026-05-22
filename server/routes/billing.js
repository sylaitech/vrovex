import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { createCheckoutSession, stripeEnabled } from '../services/stripe.js';

const router = express.Router();

router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({
      planStatus: user.planStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      tiktokShopConnected: user.tiktokShopConnected,
      stripeConfigured: stripeEnabled(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/checkout', auth, async (req, res) => {
  try {
    if (!stripeEnabled()) {
      return res.status(503).json({
        error: 'stripe_not_configured',
        message: 'Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID to server .env',
      });
    }
    const user = await User.findById(req.userId);
    const session = await createCheckoutSession(req.userId, user.email);
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
