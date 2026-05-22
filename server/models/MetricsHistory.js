import mongoose from 'mongoose';

const metricsHistorySchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  metrics: {
    accountHealth: { type: Number },
    lateDispatchRate: { type: Number },
    onTimeDeliveryRate: { type: Number },
    validTrackingRate: { type: Number },
    shieldScore: { type: Number },
    totalOrders: { type: Number },
    lateOrders: { type: Number },
    pendingOrders: { type: Number }
  },
  predictions: {
    suspensionRisk: { type: Number },
    daysUntilCritical: { type: Number },
    recommendedActions: [String]
  }
}, {
  timestamps: false
});

// Index for time-series queries
metricsHistorySchema.index({ shopId: 1, timestamp: -1 });
metricsHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

export default mongoose.model('MetricsHistory', metricsHistorySchema);
