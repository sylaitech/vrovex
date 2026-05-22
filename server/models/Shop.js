import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shopId: {
    type: String,
    required: true,
    unique: true
  },
  shopName: {
    type: String,
    required: true
  },
  region: {
    type: String,
    enum: ['US', 'UK', 'EU', 'SEA', 'OTHER'],
    default: 'US'
  },
  tiktokAccessToken: {
    type: String,
    required: true
  },
  tiktokRefreshToken: {
    type: String
  },
  tokenExpiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSync: {
    type: Date
  },
  metrics: {
    accountHealth: { type: Number, default: 1000 },
    lateDispatchRate: { type: Number, default: 0 },
    onTimeDeliveryRate: { type: Number, default: 100 },
    validTrackingRate: { type: Number, default: 100 },
    shieldScore: { type: Number, default: 100 }
  },
  status: {
    type: String,
    enum: ['healthy', 'warning', 'critical', 'suspended'],
    default: 'healthy'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
shopSchema.index({ userId: 1, shopId: 1 });
shopSchema.index({ status: 1 });

export default mongoose.model('Shop', shopSchema);
