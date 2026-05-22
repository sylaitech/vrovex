import User from '../models/User.js';
import { isStaffRole } from '../utils/creator.js';

export async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!isStaffRole(user.role)) {
      return res.status(403).json({ error: 'admin_required', message: 'Creator/admin access only.' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
