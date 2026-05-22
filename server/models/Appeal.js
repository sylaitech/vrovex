import mongoose from 'mongoose';

const appealSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['late_dispatch', 'compliance_copyright', 'seller_metrics', 'other'],
    required: true
  },
  generatedContent: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'pending'],
    default: 'draft'
  },
  tiktokCaseId: {
    type: String
  },
  submittedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

appealSchema.index({ shopId: 1, createdAt: -1 });
appealSchema.index({ userId: 1, status: 1 });

export default mongoose.model('Appeal', appealSchema);
