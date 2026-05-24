import { supabase } from '../server.js';
import { hasFullAccess } from '../utils/creator.js';

export function isPlanActive(user) {
  return hasFullAccess(user);
}

async function expireSubscriptionIfNeeded(user) {
  if (!user || user.plan_status !== 'active' || !user.current_period_end) {
    return user;
  }

  const expiresAt = new Date(user.current_period_end);
  if (expiresAt <= new Date()) {
    await supabase
      .from('users')
      .update({ plan_status: 'inactive' })
      .eq('id', user.id);

    return {
      ...user,
      plan_status: 'inactive'
    };
  }

  return user;
}

export async function requireActivePlan(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role, plan_status, current_period_end')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const normalizedUser = await expireSubscriptionIfNeeded(user);
    const profile = {
      ...normalizedUser,
      planStatus: normalizedUser.plan_status,
      currentPeriodEnd: normalizedUser.current_period_end,
    };

    if (!isPlanActive(profile)) {
      return res.status(403).json({
        error: 'subscription_required',
        message: 'Active subscription required to access monitoring and AI tools.',
        planStatus: profile.planStatus,
        currentPeriodEnd: profile.currentPeriodEnd,
      });
    }

    req.user = profile;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
