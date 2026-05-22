/**
 * Emails con acceso creador/admin sin pagar Stripe.
 * CREATOR_EMAILS en .env: comma-separated, lowercase match.
 */
export function getCreatorEmails() {
  const raw = process.env.CREATOR_EMAILS || process.env.CREATOR_EMAIL || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isCreatorEmail(email) {
  if (!email) return false;
  return getCreatorEmails().includes(String(email).trim().toLowerCase());
}

export function isStaffRole(role) {
  return role === 'admin' || role === 'creator';
}

export function hasFullAccess(user) {
  if (!user) return false;
  if (isStaffRole(user.role)) return true;
  if (user.planStatus !== 'active') return false;
  if (!user.currentPeriodEnd) return true;
  return new Date(user.currentPeriodEnd) > new Date();
}
