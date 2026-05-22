import User from '../models/User.js';
import { hasFullAccess } from '../utils/creator.js';

export function isPlanActive(user) {
  return hasFullAccess(user);
}

export async function requireActivePlan(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!isPlanActive(user)) {
      return res.status(403).json({
        error: 'subscription_required',
        message: 'Active subscription required to access monitoring and AI tools.',
        planStatus: user.planStatus,
        currentPeriodEnd: user.currentPeriodEnd,
      });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
