import cron from 'node-cron';
import { supabase } from '../server.js';
import { getShopMetrics } from './tiktok.js';
import { sendAlertEmail } from './notifications.js';
import { calculateShieldScore, predictSuspensionRisk } from '../utils/analytics.js';
import logger from '../utils/logger.js';

const LATE_DISPATCH_THRESHOLD = parseFloat(process.env.LATE_DISPATCH_THRESHOLD) || 4.0;
const ACCOUNT_HEALTH_CRITICAL = parseInt(process.env.ACCOUNT_HEALTH_CRITICAL) || 400;
const VTR_MINIMUM = parseFloat(process.env.VTR_MINIMUM) || 95.0;

async function checkShopMetrics(shop) {
  try {
    logger.info(`Checking metrics for shop: ${shop.shop_name}`);

    const metrics = await getShopMetrics(shop.tiktok_access_token, shop.shop_id);
    const shieldScore = calculateShieldScore(metrics);
    const predictions = predictSuspensionRisk(metrics);

    const status =
      metrics.accountHealth < ACCOUNT_HEALTH_CRITICAL || metrics.lateDispatchRate > LATE_DISPATCH_THRESHOLD
        ? 'critical'
        : metrics.lateDispatchRate > LATE_DISPATCH_THRESHOLD * 0.8 || metrics.validTrackingRate < VTR_MINIMUM
        ? 'warning'
        : 'healthy';

    await supabase
      .from('shops')
      .update({
        status,
        last_sync: new Date().toISOString(),
        metrics_account_health: metrics.accountHealth,
        metrics_late_dispatch_rate: metrics.lateDispatchRate,
        metrics_on_time_delivery_rate: metrics.onTimeDeliveryRate,
        metrics_valid_tracking_rate: metrics.validTrackingRate,
        metrics_shield_score: shieldScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shop.id);

    await supabase.from('metrics_history').insert({
      shop_id: shop.id,
      account_health: metrics.accountHealth,
      late_dispatch_rate: metrics.lateDispatchRate,
      on_time_delivery_rate: metrics.onTimeDeliveryRate,
      valid_tracking_rate: metrics.validTrackingRate,
      shield_score: shieldScore,
    });

    await checkAndCreateAlerts(shop, metrics, predictions);

    logger.info(`✅ Metrics updated for shop: ${shop.shop_name}`);
  } catch (error) {
    logger.error(`Failed to check metrics for shop ${shop?.shop_name || shop?.id}:`, error);
  }
}

async function checkAndCreateAlerts(shop, metrics, predictions) {
  const { data: existingAlerts = [] } = await supabase
    .from('alerts')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('is_read', false);

  const alerts = [];
  const now = new Date().toISOString();

  if (metrics.lateDispatchRate > LATE_DISPATCH_THRESHOLD) {
    const alreadyExists = existingAlerts.some((alert) => alert.data?.category === 'late_dispatch');
    if (!alreadyExists) {
      alerts.push({
        shop_id: shop.id,
        alert_type: 'danger',
        severity: 'critical',
        message: `Estás en ${metrics.lateDispatchRate.toFixed(1)}% — el límite de TikTok es ${LATE_DISPATCH_THRESHOLD}%.`,
        data: {
          category: 'late_dispatch',
          title: 'Late Dispatch Rate Crítico',
          description: `Estás en ${metrics.lateDispatchRate.toFixed(1)}% — El límite permitido de TikTok es ${LATE_DISPATCH_THRESHOLD}%. ${predictions.recommendedActions?.[0] || 'Revisa tus órdenes pendientes inmediatamente.'}`,
          metadata: {
            currentRate: metrics.lateDispatchRate,
            threshold: LATE_DISPATCH_THRESHOLD,
            daysUntilCritical: predictions.daysUntilCritical,
          },
        },
        is_read: false,
        created_at: now,
      });
    }
  }

  if (metrics.accountHealth < ACCOUNT_HEALTH_CRITICAL) {
    const alreadyExists = existingAlerts.some((alert) => alert.data?.category === 'account_health');
    if (!alreadyExists) {
      alerts.push({
        shop_id: shop.id,
        alert_type: 'danger',
        severity: 'critical',
        message: `Tu Account Health Score está en ${metrics.accountHealth}/1000.`,
        data: {
          category: 'account_health',
          title: 'Account Health Score Crítico',
          description: `Tu Account Health Score está en ${metrics.accountHealth}/1000. Riesgo de suspensión en ${predictions.daysUntilCritical} días si no se toman acciones correctivas.`,
          metadata: {
            currentScore: metrics.accountHealth,
            threshold: ACCOUNT_HEALTH_CRITICAL,
            suspensionRisk: predictions.suspensionRisk,
          },
        },
        is_read: false,
        created_at: now,
      });
    }
  }

  if (metrics.validTrackingRate < VTR_MINIMUM) {
    const alreadyExists = existingAlerts.some((alert) => alert.data?.category === 'vtr');
    if (!alreadyExists) {
      alerts.push({
        shop_id: shop.id,
        alert_type: 'warning',
        severity: 'warning',
        message: `Tu VTR está en ${metrics.validTrackingRate.toFixed(1)}%.`,
        data: {
          category: 'vtr',
          title: 'Valid Tracking Rate Bajo',
          description: `Tu VTR está en ${metrics.validTrackingRate.toFixed(1)}%. El mínimo requerido es ${VTR_MINIMUM}%. Verifica que todos los números de tracking sean válidos.`,
          metadata: {
            currentRate: metrics.validTrackingRate,
            minimum: VTR_MINIMUM,
          },
        },
        is_read: false,
        created_at: now,
      });
    }
  }

  if (alerts.length > 0) {
    const { error } = await supabase.from('alerts').insert(alerts);
    if (error) {
      logger.error('Failed to insert alerts:', error);
      return;
    }

    for (const alert of alerts) {
      try {
        await sendAlertEmail(shop.user_id, {
          title: alert.data.title,
          description: alert.data.description,
          severity: alert.severity,
          category: alert.data.category,
        });
      } catch (error) {
        logger.error('Failed to send alert email:', error);
      }
    }

    logger.info(`Created ${alerts.length} new alerts for shop: ${shop.shop_name}`);
  }
}

export function startMetricsMonitoring() {
  const interval = process.env.METRICS_CHECK_INTERVAL || 5;

  cron.schedule(`*/${interval} * * * *`, async () => {
    logger.info('🔍 Starting metrics check cycle...');

    try {
      const { data: activeShops = [], error } = await supabase
        .from('shops')
        .select('*')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      logger.info(`Found ${activeShops.length} active shops to monitor`);
      await Promise.allSettled(activeShops.map((shop) => checkShopMetrics(shop)));
      logger.info('✅ Metrics check cycle completed');
    } catch (error) {
      logger.error('Error in metrics monitoring cycle:', error);
    }
  });

  logger.info(`📊 Metrics monitoring scheduled every ${interval} minutes`);
}

export async function refreshShopMetrics(shopId) {
  const { data: shop, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single();

  if (error || !shop) {
    throw new Error('Shop not found');
  }

  await checkShopMetrics(shop);
  return shop;
}
