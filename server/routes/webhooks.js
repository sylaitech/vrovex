import express from 'express';
import { handleStripeWebhook } from '../services/stripe.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature' });
      }
      await handleStripeWebhook(req.body, signature);
      res.json({ received: true });
    } catch (error) {
      logger.error('Stripe webhook error:', error.message);
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
