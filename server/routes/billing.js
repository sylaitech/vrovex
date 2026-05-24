import express from 'express';
import { auth } from '../middleware/auth.js';
import { createCheckoutSession, stripeEnabled } from '../services/stripe.js';
import { supabase } from '../server.js';

const router = express.Router();

router.get('/status', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('plan_status, current_period_end, tiktok_shop_connected')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      planStatus: user.plan_status,
      currentPeriodEnd: user.current_period_end,
      tiktokShopConnected: user.tiktok_shop_connected,
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

    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const session = await createCheckoutSession(req.userId, user.email);
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
