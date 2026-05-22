-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin')),
  plan VARCHAR(50) DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise')),
  plan_status VARCHAR(50) DEFAULT 'inactive' CHECK (plan_status IN ('active', 'inactive', 'canceled')),
  current_period_end TIMESTAMP,
  tiktok_shop_connected BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  locale VARCHAR(10) DEFAULT 'es' CHECK (locale IN ('es', 'en')),
  alert_email BOOLEAN DEFAULT TRUE,
  alert_push BOOLEAN DEFAULT TRUE,
  alert_sms BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id VARCHAR(255) UNIQUE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  region VARCHAR(50) DEFAULT 'US' CHECK (region IN ('US', 'UK', 'EU', 'SEA', 'OTHER')),
  tiktok_access_token TEXT NOT NULL,
  tiktok_refresh_token TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP,
  status VARCHAR(50) DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical', 'suspended')),
  metrics_account_health NUMERIC(10, 2) DEFAULT 1000,
  metrics_late_dispatch_rate NUMERIC(10, 2) DEFAULT 0,
  metrics_on_time_delivery_rate NUMERIC(10, 2) DEFAULT 100,
  metrics_valid_tracking_rate NUMERIC(10, 2) DEFAULT 100,
  metrics_shield_score NUMERIC(10, 2) DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Metrics History table
CREATE TABLE IF NOT EXISTS metrics_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  account_health NUMERIC(10, 2),
  late_dispatch_rate NUMERIC(10, 2),
  on_time_delivery_rate NUMERIC(10, 2),
  valid_tracking_rate NUMERIC(10, 2),
  shield_score NUMERIC(10, 2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appeals table
CREATE TABLE IF NOT EXISTS appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  reason TEXT NOT NULL,
  evidence JSONB,
  response TEXT,
  submitted_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_plan_status ON users(plan_status);
CREATE INDEX idx_shops_user_id ON shops(user_id);
CREATE INDEX idx_shops_status ON shops(status);
CREATE INDEX idx_metrics_history_shop_id ON metrics_history(shop_id);
CREATE INDEX idx_metrics_history_recorded_at ON metrics_history(recorded_at);
CREATE INDEX idx_alerts_shop_id ON alerts(shop_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_appeals_shop_id ON appeals(shop_id);
CREATE INDEX idx_appeals_status ON appeals(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for shops
CREATE POLICY "Users can view their own shops"
  ON shops FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth.uid() = id));

-- RLS Policies for alerts
CREATE POLICY "Users can view their own alerts"
  ON alerts FOR SELECT
  USING (shop_id IN (
    SELECT id FROM shops 
    WHERE user_id IN (SELECT id FROM users WHERE auth.uid() = id)
  ));
