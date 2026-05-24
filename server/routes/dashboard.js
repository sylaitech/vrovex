import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/requireActivePlan.js';
import { supabase } from '../server.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

// UI alias → DB column value
// The DB stores 'warning'; the frontend may send 'medium' as an alias.
const SEVERITY_MAP = {
  low:      'low',
  medium:   'warning',
  warning:  'warning',
  critical: 'critical'
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Translate the shops.status column into a normalized risk_level string.
 * 'healthy' → 'low' so the frontend always receives one of: low | warning | critical
 */
function shopStatusToRiskLevel(status) {
  if (status === 'critical') return 'critical';
  if (status === 'warning')  return 'warning';
  return 'low';
}

/**
 * Parse and clamp pagination query params to safe integers.
 */
function parsePagination(pageRaw, limitRaw) {
  const page  = Math.max(DEFAULT_PAGE, parseInt(pageRaw,  10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limitRaw, 10) || DEFAULT_LIMIT));
  return { page, limit };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vrovex/dashboard-summary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the current shield status and paginated alert history for a shop.
 *
 * Query params:
 *   shop_id  {string}  required  — internal UUID of the shop
 *   page     {number}  optional  — default 1
 *   limit    {number}  optional  — default 10, max 100
 *   severity {string}  optional  — low | medium | warning | critical
 */
router.get('/dashboard-summary', auth, requireActivePlan, async (req, res) => {
  const { shop_id, page: pageRaw, limit: limitRaw, severity } = req.query;
  const userId = req.userId;

  try {
    // ── 1. Input validation ───────────────────────────────────────────────
    if (!shop_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: shop_id'
      });
    }

    const { page, limit } = parsePagination(pageRaw, limitRaw);

    // Normalize severity: empty string behaves as "no filter"
    const severityInput = severity?.trim() || undefined;
    const dbSeverity    = severityInput ? SEVERITY_MAP[severityInput] : undefined;

    if (severityInput && !dbSeverity) {
      return res.status(400).json({
        success: false,
        error: `Invalid severity "${severityInput}". Valid values: ${Object.keys(SEVERITY_MAP).join(', ')}`
      });
    }

    // ── 2. IDOR guard + shop data (single ownership-verified query) ───────
    //
    // We embed the ownership check directly in the shop query (.eq('user_id', userId)).
    // This collapses what would be two round-trips into one and avoids timing-oracle
    // issues: the caller can never distinguish "shop not found" from "shop not yours".
    //
    // Both the shop query and the alerts query are launched in parallel via
    // Promise.all. For legitimate requests this hides all latency behind the
    // slower of the two. For unauthorized requests the alerts result is silently
    // discarded — the data never leaves the server.

    const from = (page - 1) * limit;
    const to   = from + limit - 1;

    let alertsQuery = supabase
      .from('alerts')
      .select(
        'id, alert_type, severity, message, data, is_read, created_at',
        { count: 'exact' }
      )
      .eq('shop_id', shop_id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (dbSeverity) {
      alertsQuery = alertsQuery.eq('severity', dbSeverity);
    }

    const [shopResult, alertsResult] = await Promise.all([
      supabase
        .from('shops')
        .select('metrics_shield_score, status, last_sync, shop_name')
        .eq('id', shop_id)
        .eq('user_id', userId)   // ← ownership check / IDOR guard
        .maybeSingle(),
      alertsQuery
    ]);

    // ── 3. IDOR response ──────────────────────────────────────────────────
    if (shopResult.error) {
      logger.error('dashboard-summary: shop query failed', {
        userId,
        shopId: shop_id,
        error: shopResult.error.message
      });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }

    if (!shopResult.data) {
      // Return 403, NOT 404.
      // A 404 would leak the existence of the resource to an attacker probing UUIDs.
      logger.warn('dashboard-summary: 403 — shop not found or not owned', {
        userId,
        shopId: shop_id
      });
      return res.status(403).json({
        success: false,
        error: 'Forbidden'
      });
    }

    // ── 4. Alerts error handling ──────────────────────────────────────────
    if (alertsResult.error) {
      logger.error('dashboard-summary: alerts query failed', {
        userId,
        shopId: shop_id,
        error: alertsResult.error.message
      });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }

    // ── 5. Build response ─────────────────────────────────────────────────
    const shop       = shopResult.data;
    const alerts     = alertsResult.data  ?? [];
    const totalCount = alertsResult.count ?? 0;

    // requires_review is true when the AI audit fallback flagged any active alert
    // for human verification (source === 'fallback' → requiresReview === true in metadata).
    const requiresReview = alerts.some(
      a => !a.is_read && a.data?.metadata?.requiresReview === true
    );

    logger.info('dashboard-summary: served', {
      userId,
      shopId:     shop_id,
      shieldScore: shop.metrics_shield_score,
      alertCount:  totalCount,
      page,
      limit
    });

    return res.json({
      success: true,
      summary: {
        current_shield_score: shop.metrics_shield_score ?? 0,
        risk_level:           shopStatusToRiskLevel(shop.status),
        requires_review:      requiresReview,
        last_audit_at:        shop.last_sync ?? null
      },
      alerts,
      pagination: {
        current_page: page,
        limit,
        total_count:  totalCount,
        total_pages:  Math.ceil(totalCount / limit) || 1
      }
    });
  } catch (err) {
    logger.error('dashboard-summary: unhandled exception', {
      userId,
      shopId: shop_id,
      error:  err.message,
      stack:  err.stack
    });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
