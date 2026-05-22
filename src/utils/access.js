export function isStaffRole(role) {
  return role === 'admin' || role === 'creator';
}

export function hasFullAccessFromProfile({ role, planStatus, currentPeriodEnd }) {
  if (isStaffRole(role)) return true;
  if (import.meta.env.VITE_DEMO_PLAN === 'active') return true;
  if (planStatus !== 'active') return false;
  if (!currentPeriodEnd) return true;
  return new Date(currentPeriodEnd) > new Date();
}
