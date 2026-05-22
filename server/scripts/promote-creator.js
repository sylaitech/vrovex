/**
 * Promote existing user to creator (full access, no Stripe).
 * Usage: node scripts/promote-creator.js user@email.com
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/promote-creator.js email@example.com');
  process.exit(1);
}

const far = new Date();
far.setFullYear(far.getFullYear() + 10);

await mongoose.connect(process.env.MONGODB_URI);
const user = await User.findOne({ email: email.toLowerCase() });
if (!user) {
  console.error('User not found');
  process.exit(1);
}
user.role = 'creator';
user.planStatus = 'active';
user.currentPeriodEnd = far;
await user.save();
console.log(`✅ ${user.email} → creator (active until ${far.toISOString()})`);
await mongoose.disconnect();
