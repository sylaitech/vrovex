import crypto from 'crypto';
import express from 'express';
import { handleStripeWebhook } from '../services/stripe.js';
import { processWebhookAudit } from '../services/aiAudit.js';
import { sendAlertEmail } from '../services/notifications.js';
import { supabase } from '../server.js';
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

/**
 * TikTok Shop webhook — receives shop status / violation events 24/7.
 *
 * Signature scheme (TikTok Open Platform):
 *   sign_string = APP_SECRET + timestamp + nonce + rawBody
 *   signature   = HMAC-SHA256(sign_string, APP_SECRET).hex()
 *   header      = x-tiktok-signature
 *
 * Configure TIKTOK_WEBHOOK_SECRET in .env with the same value as TIKTOK_APP_SECRET
 * (or a dedicated webhook secret from the TikTok Developer Portal).
 */
router.post(
  '/tiktok',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const secret = process.env.TIKTOK_WEBHOOK_SECRET || process.env.TIKTOK_APP_SECRET;

    if (!secret) {
      logger.error('TikTok webhook: TIKTOK_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const receivedSig = req.headers['x-tiktok-signature'] || '';
    const timestamp   = req.headers['x-tiktok-timestamp'] || '';
    const nonce       = req.headers['x-tiktok-nonce']     || '';
    const rawBody     = req.body instanceof Buffer ? req.body.toString('utf8') : '';

    const signString  = `${secret}${timestamp}${nonce}${rawBody}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(signString).digest('hex');

    // Length check first (not secret) then constant-time comparison.
    // Padding-based approaches can allow null-byte extension attacks.
    const sigValid =
      receivedSig.length === expectedSig.length &&
      crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));

    if (!sigValid) {
      logger.warn('TikTok webhook: invalid signature', { timestamp });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // ACK immediately — TikTok requires a response within 3 seconds
    res.json({ received: true });

    // Process in background so we never block the HTTP response
    setImmediate(() => processTikTokEvent(rawBody).catch(err =>
      logger.error('TikTok webhook background processing error', { error: err.message })
    ));
  }
);

async function processTikTokEvent(rawBody) {
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    logger.error('TikTok webhook: failed to parse JSON body');
    return;
  }

  const tiktokShopId = payload?.shop_id || payload?.data?.shop_id;
  if (!tiktokShopId) {
    logger.warn('TikTok webhook: payload missing shop_id', { payload });
    return;
  }

  // Resolve internal shop record
  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('id, user_id, shop_name')
    .eq('tiktok_shop_id', tiktokShopId)
    .single();

  if (shopError || !shop) {
    logger.warn('TikTok webhook: shop not found', { tiktokShopId });
    return;
  }

  const auditData = payload?.data || payload;
  const result = await processWebhookAudit(auditData, shop.id);

  logger.info('TikTok webhook audit result', {
    shopId: shop.id,
    shopName: shop.shop_name,
    riskScore: result.riskScore,
    riskLevel: result.riskLevel,
    actionRequired: result.actionRequired,
    source: result.source,
    requiresReview: result.requiresReview,
    auditHash: result.auditHash
  });

  if (!result.actionRequired) return;

  // Persist alert
  const alertType = result.riskLevel === 'critical' ? 'danger' : 'warning';
  const { data: alert, error: alertError } = await supabase
    .from('alerts')
    .insert({
      shop_id: shop.id,
      alert_type: alertType,
      severity: result.riskLevel,
      message: `TikTok detectó actividad de riesgo: score ${result.riskScore}/10`,
      data: {
        category: 'tiktok_webhook',
        title: result.riskLevel === 'critical'
          ? '🚨 Riesgo Crítico Detectado en tu Tienda'
          : '⚠️ Advertencia de Cumplimiento TikTok',
        description: result.reasoning,
        metadata: {
          riskScore:      result.riskScore,
          riskLevel:      result.riskLevel,
          auditHash:      result.auditHash,
          source:         result.source,
          requiresReview: result.requiresReview,
          rawEvent:       payload?.type
        }
      },
      is_read: false,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (alertError) {
    logger.error('TikTok webhook: failed to insert alert', { error: alertError.message });
    return;
  }

  // Fire-and-forget email — never block on email failure
  sendAlertEmail(shop.user_id, {
    title:       alert.data.title,
    description: alert.data.description,
    severity:    result.riskScore,
    category:    'tiktok_webhook'
  }).catch(err => logger.error('TikTok webhook: alert email failed', { error: err.message }));
}

export default router;
