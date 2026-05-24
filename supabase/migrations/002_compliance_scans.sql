-- Create compliance_scans table for storing scan results
CREATE TABLE IF NOT EXISTS compliance_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_level INTEGER NOT NULL DEFAULT 0,
  total_issues INTEGER NOT NULL DEFAULT 0,
  critical_issues INTEGER NOT NULL DEFAULT 0,
  warning_issues INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  scan_results JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS compliance_scans_shop_id_idx ON compliance_scans(shop_id);
CREATE INDEX IF NOT EXISTS compliance_scans_user_id_idx ON compliance_scans(user_id);
CREATE INDEX IF NOT EXISTS compliance_scans_created_at_idx ON compliance_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS compliance_scans_status_idx ON compliance_scans(status);

-- Enable RLS
ALTER TABLE compliance_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own compliance scans"
  ON compliance_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert compliance scans for their shops"
  ON compliance_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_compliance_scans_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compliance_scans_update_timestamp
  BEFORE UPDATE ON compliance_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_scans_timestamp();
