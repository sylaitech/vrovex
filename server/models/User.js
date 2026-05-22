import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'creator', 'admin'],
    default: 'user',
    index: true
  },
  plan: {
    type: String,
    enum: ['basic', 'pro', 'enterprise'],
    default: 'basic'
  },
  planStatus: {
    type: String,
    enum: ['active', 'inactive', 'canceled'],
    default: 'inactive',
    index: true
  },
  currentPeriodEnd: {
    type: Date,
    default: null
  },
  tiktokShopConnected: {
    type: Boolean,
    default: false
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  supabaseId: String,
  locale: {
    type: String,
    enum: ['es', 'en'],
    default: 'es'
  },
  shops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  }],
  emailVerified: {
    type: Boolean,
    default: false
  },
  alertPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
