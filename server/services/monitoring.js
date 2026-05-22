import cron from 'node-cron';
import Shop from '../models/Shop.js';
import Alert from '../models/Alert.js';
import MetricsHistory from '../models/MetricsHistory.js';
import { getShopMetrics } from './tiktok.js';
import { sendAlertEmail } from './notifications.js';
import { calculateShieldScore, predictSuspensionRisk } from '../utils/analytics.js';
import logger from '../utils/logger.js';

const LATE_DISPATCH_THRESHOLD = parseFloat(process.env.LATE_DISPATCH_THRESHOLD) || 4.0;
const ACCOUNT_HEALTH_CRITICAL = parseInt(process.env.ACCOUNT_HEALTH_CRITICAL) || 400;
const VTR_MINIMUM = parseFloat(process.env.VTR_MINIMUM) || 95.0;

/**
 * Check metrics for a single shop
 */
async function checkShopMetrics(shop) {
  try {
    logger.info(`Checking metrics for shop: ${shop.shopName}`);
    
    // Fetch latest metrics from TikTok
    const metrics = await getShopMetrics(shop.tiktokAccessToken, shop.shopId);
    
    // Calculate shield score
    const shieldScore = calculateShieldScore(metrics);
    
    // Predict suspension risk
    const predictions = predictSuspensionRisk(metrics);
    
    // Update shop metrics
    shop.metrics = {
      ...metrics,
      shieldScore
    };
    
    // Determine shop status
    if (metrics.accountHealth < ACCOUNT_HEALTH_CRITICAL || metrics.lateDispatchRate > LATE_DISPATCH_THRESHOLD) {
      shop.status = 'critical';
    } else if (metrics.lateDispatchRate > LATE_DISPATCH_THRESHOLD * 0.8 || metrics.validTrackingRate < VTR_MINIMUM) {
      shop.status = 'warning';
    } else {
      shop.status = 'healthy';
    }
    
    shop.lastSync = new Date();
    await shop.save();
    
    // Save metrics history
    await MetricsHistory.create({
      shopId: shop._id,
      timestamp: new Date(),
      metrics: {
        ...metrics,
        shieldScore
      },
      predictions
    });
    
    // Check for alerts
    await checkAndCreateAlerts(shop, metrics, predictions);
    
    logger.info(`✅ Metrics updated for shop: ${shop.shopName}`);
  } catch (error) {
    logger.error(`Failed to check metrics for shop ${shop.shopName}:`, error);
  }
}

/**
 * Create alerts based on metrics
 */
async function checkAndCreateAlerts(shop, metrics, predictions) {
  const alerts = [];
  
  // Late Dispatch Rate Alert
  if (metrics.lateDispatchRate > LATE_DISPATCH_THRESHOLD) {
    const existingAlert = await Alert.findOne({
      shopId: shop._id,
      category: 'late_dispatch',
      status: 'active'
    });
    
    if (!existingAlert) {
      alerts.push({
        shopId: shop._id,
        userId: shop.userId,
        type: 'danger',
        category: 'late_dispatch',
        title: 'Late Dispatch Rate Crítico',
        description: `Estás en ${metrics.lateDispatchRate.toFixed(1)}% — El límite permitido de TikTok es ${LATE_DISPATCH_THRESHOLD}%. ${predictions.recommendedActions[0] || 'Revisa tus órdenes pendientes inmediatamente.'}`,
        severity: 9,
        metadata: {
          currentRate: metrics.lateDispatchRate,
          threshold: LATE_DISPATCH_THRESHOLD,
          daysUntilCritical: predictions.daysUntilCritical
        }
      });
    }
  }
  
  // Account Health Alert
  if (metrics.accountHealth < ACCOUNT_HEALTH_CRITICAL) {
    const existingAlert = await Alert.findOne({
      shopId: shop._id,
      category: 'account_health',
      status: 'active'
    });
    
    if (!existingAlert) {
      alerts.push({
        shopId: shop._id,
        userId: shop.userId,
        type: 'danger',
        category: 'account_health',
        title: 'Account Health Score Crítico',
        description: `Tu Account Health Score está en ${metrics.accountHealth}/1000. Riesgo de suspensión en ${predictions.daysUntilCritical} días si no se toman acciones correctivas.`,
        severity: 10,
        metadata: {
          currentScore: metrics.accountHealth,
          threshold: ACCOUNT_HEALTH_CRITICAL,
          suspensionRisk: predictions.suspensionRisk
        }
      });
    }
  }
  
  // Valid Tracking Rate Alert
  if (metrics.validTrackingRate < VTR_MINIMUM) {
    const existingAlert = await Alert.findOne({
      shopId: shop._id,
      category: 'vtr',
      status: 'active'
    });
    
    if (!existingAlert) {
      alerts.push({
        shopId: shop._id,
        userId: shop.userId,
        type: 'warning',
        category: 'vtr',
        title: 'Valid Tracking Rate Bajo',
        description: `Tu VTR está en ${metrics.validTrackingRate.toFixed(1)}%. El mínimo requerido es ${VTR_MINIMUM}%. Verifica que todos los números de tracking sean válidos.`,
        severity: 7,
        metadata: {
          currentRate: metrics.validTrackingRate,
          minimum: VTR_MINIMUM
        }
      });
    }
  }
  
  // Create alerts and send notifications
  if (alerts.length > 0) {
    await Alert.insertMany(alerts);
    
    // Send email notifications
    for (const alert of alerts) {
      try {
        await sendAlertEmail(shop.userId, alert);
      } catch (error) {
        logger.error('Failed to send alert email:', error);
      }
    }
    
    logger.info(`Created ${alerts.length} new alerts for shop: ${shop.shopName}`);
  }
}

/**
 * Start monitoring all active shops
 */
export function startMetricsMonitoring() {
  const interval = process.env.METRICS_CHECK_INTERVAL || 5;
  
  // Run every X minutes
  cron.schedule(`*/${interval} * * * *`, async () => {
    logger.info('🔍 Starting metrics check cycle...');
    
    try {
      const activeShops = await Shop.find({ isActive: true }).populate('userId');
      
      logger.info(`Found ${activeShops.length} active shops to monitor`);
      
      // Check metrics for all shops in parallel
      await Promise.allSettled(
        activeShops.map(shop => checkShopMetrics(shop))
      );
      
      logger.info('✅ Metrics check cycle completed');
    } catch (error) {
      logger.error('Error in metrics monitoring cycle:', error);
    }
  });
  
  logger.info(`📊 Metrics monitoring scheduled every ${interval} minutes`);
}

/**
 * Manual metrics refresh for a specific shop
 */
export async function refreshShopMetrics(shopId) {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new Error('Shop not found');
  }
  
  await checkShopMetrics(shop);
  return shop;
}
