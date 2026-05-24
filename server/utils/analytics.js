/**
 * Calculate Vrovex Shield Score (0-100)
 */
export function calculateShieldScore(metrics) {
  const weights = {
    accountHealth: 0.35,
    lateDispatch: 0.30,
    onTimeDelivery: 0.20,
    validTracking: 0.15
  };
  
  // Normalize metrics to 0-100 scale
  const accountHealthScore = (metrics.accountHealth / 1000) * 100;
  const lateDispatchScore = Math.max(0, 100 - (metrics.lateDispatchRate * 25));
  const onTimeDeliveryScore = metrics.onTimeDeliveryRate;
  const validTrackingScore = metrics.validTrackingRate;
  
  const shieldScore = 
    (accountHealthScore * weights.accountHealth) +
    (lateDispatchScore * weights.lateDispatch) +
    (onTimeDeliveryScore * weights.onTimeDelivery) +
    (validTrackingScore * weights.validTracking);
  
  return Math.round(Math.max(0, Math.min(100, shieldScore)));
}

/**
 * Predict suspension risk and days until critical
 */
export function predictSuspensionRisk(metrics) {
  let suspensionRisk = 0;
  let daysUntilCritical = null;
  const recommendedActions = [];
  
  // Account Health Risk
  if (metrics.accountHealth < 400) {
    suspensionRisk += 40;
    daysUntilCritical = Math.max(1, Math.floor((metrics.accountHealth - 200) / 10));
    recommendedActions.push('Contacta a TikTok Support inmediatamente para revisar penalizaciones activas');
  } else if (metrics.accountHealth < 600) {
    suspensionRisk += 20;
    daysUntilCritical = 7;
    recommendedActions.push('Revisa tus métricas de servicio al cliente y resuelve disputas pendientes');
  }
  
  // Late Dispatch Risk
  if (metrics.lateDispatchRate > 4.0) {
    suspensionRisk += 35;
    if (!daysUntilCritical || daysUntilCritical > 2) {
      daysUntilCritical = 2;
    }
    recommendedActions.push('Despacha todas las órdenes pendientes en las próximas 24 horas');
  } else if (metrics.lateDispatchRate > 3.0) {
    suspensionRisk += 15;
    recommendedActions.push('Optimiza tu proceso de fulfillment para evitar retrasos');
  }
  
  // Valid Tracking Risk
  if (metrics.validTrackingRate < 95.0) {
    suspensionRisk += 15;
    recommendedActions.push('Verifica que todos los números de tracking sean válidos y estén actualizados');
  }
  
  // On-Time Delivery Risk
  if (metrics.onTimeDeliveryRate < 90.0) {
    suspensionRisk += 10;
    recommendedActions.push('Considera cambiar de transportista o método de envío');
  }
  
  return {
    suspensionRisk: Math.min(100, suspensionRisk),
    daysUntilCritical: daysUntilCritical || 30,
    recommendedActions: recommendedActions.length > 0 
      ? recommendedActions 
      : ['Mantén tus métricas actuales y continúa monitoreando']
  };
}

/**
 * Analyze metrics trend
 */
export function analyzeMetricsTrend(history) {
  if (history.length < 2) {
    return { trend: 'stable', change: 0 };
  }
  
  const recent = history[history.length - 1];
  const previous = history[history.length - 2];
  
  const change = recent.metrics.shieldScore - previous.metrics.shieldScore;
  
  let trend = 'stable';
  if (change > 5) trend = 'improving';
  if (change < -5) trend = 'declining';
  
  return { trend, change };
}

