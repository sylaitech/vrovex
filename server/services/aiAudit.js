import crypto from 'crypto';
import axios from 'axios';
import { supabase } from '../server.js';
import logger from '../utils/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
// Data normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize TikTok webhook payload to a deterministic string for hashing.
 * Violations are sorted so that delivery order never changes the hash.
 */
export function cleanTikTokData(rawData) {
  const status = rawData?.status || 'unknown';

  let violationsStr = 'none';
  if (rawData?.violations && Array.isArray(rawData.violations)) {
    violationsStr = rawData.violations
      .map(v => `${v.type || 'unknown'}:${v.points || 0}`)
      .sort()
      .join(',');
  } else if (rawData?.violation_points != null) {
    violationsStr = `points:${rawData.violation_points}`;
  }

  const health = rawData?.account_health ?? rawData?.accountHealth ?? 'unknown';

  return `status:${status}|violations:[${violationsStr}]|health:${health}`;
}

export function computeAuditHash(cleanedData) {
  return crypto.createHash('sha256').update(cleanedData).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback scorer (no AI)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pure math fallback used when OpenAI is unreachable or unconfigured.
 * Always sets requiresReview=true so ops can spot-check the result.
 */
function fallbackRiskScore(rawData) {
  let points = 0;

  if (Array.isArray(rawData?.violations)) {
    points = rawData.violations.reduce((acc, v) => acc + (parseInt(v.points) || 0), 0);
  } else if (rawData?.violation_points != null) {
    points = parseInt(rawData.violation_points) || 0;
  }

  const health = parseInt(rawData?.account_health ?? rawData?.accountHealth) || 1000;
  if (health < 400) points += 50;
  else if (health < 600) points += 20;

  const riskScore = Math.min(10, Math.round(points / 10));
  const riskLevel = riskScore >= 8 ? 'critical' : riskScore >= 5 ? 'warning' : 'low';

  return {
    riskScore,
    riskLevel,
    actionRequired: riskScore >= 5,
    reasoning: 'Deterministic fallback — AI unavailable at processing time',
    requiresReview: true,
    source: 'fallback'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI caller
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call GPT-4o-mini with up to `retries` attempts and a hard timeout.
 * Throws only after all retries are exhausted.
 */
async function callOpenAIWithRetry(messages, retries = 2, timeoutMs = 5000) {
  const apiKey = process.env.OPENAI_API_KEY;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 300,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: timeoutMs
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      const isLast = attempt === retries;
      if (isLast) throw error;
      logger.warn('OpenAI call failed, retrying', {
        attempt: attempt + 1,
        maxRetries: retries,
        error: error.message
      });
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache persistence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Write the audit result back to shops.last_audit_data_hash / last_audit_result.
 * Non-blocking: a failure here logs an error but never throws into the main flow.
 */
async function persistAuditCache(shopId, auditHash, result) {
  const { error } = await supabase
    .from('shops')
    .update({
      last_audit_data_hash: auditHash,
      last_audit_result:    result,
      updated_at:           new Date().toISOString()
    })
    .eq('id', shopId);

  if (error) {
    logger.error('aiAudit: cache persist failed', {
      shopId,
      auditHash,
      error: error.message
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Orchestrates the full audit pipeline:
 *
 *   1. Normalize payload → deterministic hash
 *   2. Read shops.last_audit_data_hash from Supabase
 *   3a. CACHE HIT  → return stored result at $0 cost
 *       Special case: if the cached result came from the fallback (requiresReview=true)
 *       AND OpenAI is now reachable, force a re-audit to upgrade the score.
 *   3b. CACHE MISS → call OpenAI (or fallback if key absent)
 *   4. Persist new hash + result to the shop row
 */
export async function processWebhookAudit(rawData, shopId) {
  const cleanedData = cleanTikTokData(rawData);
  const auditHash   = computeAuditHash(cleanedData);

  // ── 1. Cache read ────────────────────────────────────────────────────────
  const { data: shopRow, error: cacheReadError } = await supabase
    .from('shops')
    .select('last_audit_data_hash, last_audit_result')
    .eq('id', shopId)
    .single();

  if (cacheReadError) {
    // Non-fatal: log and continue — worst case we call OpenAI unnecessarily once.
    logger.warn('aiAudit: cache read failed — proceeding without cache', {
      shopId,
      error: cacheReadError.message
    });
  }

  // ── 2. Cache hit evaluation ──────────────────────────────────────────────
  const hashMatches   = shopRow?.last_audit_data_hash === auditHash;
  const cachedResult  = shopRow?.last_audit_result;
  const openAIEnabled = Boolean(process.env.OPENAI_API_KEY);

  if (hashMatches && cachedResult) {
    // A previously fallback-scored result (requiresReview=true) can be upgraded
    // to a real AI score now that OpenAI is reachable. Otherwise serve from cache.
    const isStalesFallback = cachedResult.requiresReview === true && openAIEnabled;

    if (!isStalesFallback) {
      logger.info('AI audit cache hit — $0 cost', {
        shopId,
        auditHash,
        source:      'cache',
        cachedSource: cachedResult.source,
        riskScore:   cachedResult.riskScore
      });
      return { ...cachedResult, auditHash, source: 'cache' };
    }

    logger.info('aiAudit: upgrading stale fallback cache with OpenAI', {
      shopId,
      auditHash
    });
    // Fall through to OpenAI call below.
  }

  // ── 3. No OpenAI key — run fallback and persist ──────────────────────────
  if (!openAIEnabled) {
    logger.warn('OPENAI_API_KEY not configured — using fallback score', { shopId });
    const fallback = fallbackRiskScore(rawData);
    const result   = { ...fallback, auditHash };
    await persistAuditCache(shopId, auditHash, result);
    return result;
  }

  // ── 4. OpenAI call ───────────────────────────────────────────────────────
  const messages = [
    {
      role: 'system',
      content:
        'You are a TikTok Shop compliance analyst. Analyze the shop status data and return a JSON object with exactly these fields: riskScore (integer 0-10), riskLevel ("low"|"warning"|"critical"), actionRequired (boolean), reasoning (string, max 120 chars).'
    },
    {
      role: 'user',
      content: `Analyze this TikTok Shop normalized data: ${cleanedData}`
    }
  ];

  try {
    const t0      = Date.now();
    const raw     = await callOpenAIWithRetry(messages);
    const elapsed = Date.now() - t0;
    const parsed  = JSON.parse(raw);

    const result = { ...parsed, auditHash, requiresReview: false, source: 'openai' };

    logger.info('AI audit completed', {
      shopId,
      auditHash,
      source:    'openai',
      elapsedMs: elapsed,
      riskScore: parsed.riskScore
    });

    // Persist after a successful AI call.
    await persistAuditCache(shopId, auditHash, result);
    return result;

  } catch (error) {
    // ── 5. OpenAI exhausted — activate fallback ───────────────────────────
    logger.error('OpenAI audit exhausted retries — applying fallback', {
      shopId,
      auditHash,
      error: error.message
    });

    const fallback = fallbackRiskScore(rawData);
    const result   = { ...fallback, auditHash };

    logger.info('Fallback score applied', {
      shopId,
      auditHash,
      source:        'fallback',
      riskScore:     fallback.riskScore,
      requiresReview: true
    });

    // Persist fallback too: same data → same fallback score → $0 on repeat calls.
    // If OpenAI recovers, the "stale fallback" branch above will force a re-audit.
    await persistAuditCache(shopId, auditHash, result);
    return result;
  }
}
