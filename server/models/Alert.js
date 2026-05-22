import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['danger', 'warning', 'info'],
    required: true
  },
  category: {
    type: String,
    enum: ['late_dispatch', 'account_health', 'vtr', 'compliance', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'dismissed'],
    default: 'active'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
alertSchema.index({ shopId: 1, status: 1 });
alertSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Alert', alertSchema);
