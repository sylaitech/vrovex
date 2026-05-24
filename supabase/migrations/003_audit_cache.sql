-- Add audit cache columns to shops table.
-- last_audit_data_hash  → SHA-256 hex of the normalized TikTok payload.
--                         Used by aiAudit.js to short-circuit OpenAI calls when the
--                         shop data hasn't changed since the last audit ($0 cost).
-- last_audit_result     → Full JSON result object persisted after each audit run
--                         (from OpenAI or the deterministic fallback).

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS last_audit_data_hash VARCHAR(64),
  ADD COLUMN IF NOT EXISTS last_audit_result     JSONB;

-- Lookup index — the cache check queries this column on every webhook event.
CREATE INDEX IF NOT EXISTS idx_shops_last_audit_hash
  ON shops (last_audit_data_hash);
