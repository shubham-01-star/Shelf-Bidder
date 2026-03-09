-- ============================================================================
-- Shelf-Bidder PostgreSQL Schema
-- Hybrid VPS + AWS Architecture with ACID-compliant transactions
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SHOPKEEPERS TABLE
-- Stores shopkeeper profiles and account information
-- ============================================================================
CREATE TABLE shopkeepers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopkeeper_id VARCHAR(255) UNIQUE NOT NULL, -- Stable external-facing shopkeeper identifier
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  store_address TEXT NOT NULL,
  store_location POINT, -- Geographic coordinates for campaign matching
  preferred_language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  wallet_balance DECIMAL(10,2) DEFAULT 0.00 CHECK (wallet_balance >= 0),
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for shopkeepers
CREATE INDEX idx_shopkeepers_phone ON shopkeepers(phone_number);
CREATE INDEX idx_shopkeepers_email ON shopkeepers(email);
CREATE INDEX idx_shopkeepers_shopkeeper_id ON shopkeepers(shopkeeper_id);
CREATE INDEX idx_shopkeepers_last_active ON shopkeepers(last_active_date);
CREATE INDEX idx_shopkeepers_location ON shopkeepers USING GIST(store_location);

-- ============================================================================
-- SHELF SPACES TABLE
-- Stores shelf analysis results and empty space data
-- ============================================================================
CREATE TABLE shelf_spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopkeeper_id UUID NOT NULL REFERENCES shopkeepers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  empty_spaces JSONB NOT NULL, -- Array of empty space objects
  current_inventory JSONB NOT NULL, -- Array of product objects
  analysis_confidence INTEGER CHECK (analysis_confidence >= 0 AND analysis_confidence <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for shelf_spaces
CREATE INDEX idx_shelf_spaces_shopkeeper ON shelf_spaces(shopkeeper_id);
CREATE INDEX idx_shelf_spaces_date ON shelf_spaces(analysis_date DESC);
CREATE INDEX idx_shelf_spaces_confidence ON shelf_spaces(analysis_confidence);
CREATE INDEX idx_shelf_spaces_empty_spaces ON shelf_spaces USING GIN(empty_spaces);

-- ============================================================================
-- CAMPAIGNS TABLE
-- Stores brand campaigns with budget allocation
-- ============================================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(100) NOT NULL,
  budget DECIMAL(10,2) NOT NULL CHECK (budget > 0),
  remaining_budget DECIMAL(10,2) NOT NULL CHECK (remaining_budget >= 0),
  payout_per_task DECIMAL(10,2) NOT NULL CHECK (payout_per_task > 0),
  target_locations TEXT[] NOT NULL, -- Array of location strings
  target_radius_km DECIMAL(5,2) DEFAULT 5.0, -- Radius for location matching
  placement_requirements JSONB NOT NULL,
  product_dimensions JSONB NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_budget CHECK (remaining_budget <= budget)
);

-- Indexes for campaigns
CREATE INDEX idx_campaigns_agent ON campaigns(agent_id);
CREATE INDEX idx_campaigns_status ON campaigns(status) WHERE status = 'active';
CREATE INDEX idx_campaigns_budget ON campaigns(remaining_budget) WHERE status = 'active';
CREATE INDEX idx_campaigns_location ON campaigns USING GIN(target_locations);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_category ON campaigns(product_category);

-- ============================================================================
-- TASKS TABLE
-- Stores product placement tasks assigned to shopkeepers
-- ============================================================================
-- TASKS TABLE
-- Stores product placement tasks assigned to shopkeepers
-- ============================================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  shopkeeper_id UUID NOT NULL REFERENCES shopkeepers(id) ON DELETE CASCADE,
  shelf_space_id UUID NOT NULL REFERENCES shelf_spaces(id) ON DELETE CASCADE,
  instructions JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'failed', 'expired')),
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
  completed_date TIMESTAMP,
  proof_photo_url TEXT,
  earnings DECIMAL(10,2) NOT NULL CHECK (earnings >= 0),
  verification_result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_expiry CHECK (expires_at > assigned_date)
);

-- Indexes for tasks
CREATE INDEX idx_tasks_shopkeeper ON tasks(shopkeeper_id);
CREATE INDEX idx_tasks_campaign ON tasks(campaign_id);
CREATE INDEX idx_tasks_shelf_space ON tasks(shelf_space_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_date ON tasks(assigned_date DESC);
CREATE INDEX idx_tasks_completed_date ON tasks(completed_date DESC) WHERE completed_date IS NOT NULL;
CREATE INDEX idx_tasks_expires_at ON tasks(expires_at) WHERE status IN ('assigned', 'in_progress');

-- ============================================================================
-- WALLET TRANSACTIONS TABLE
-- Stores all financial transactions for audit trail
-- ============================================================================
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopkeeper_id UUID NOT NULL REFERENCES shopkeepers(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earning', 'payout', 'adjustment', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for wallet_transactions
CREATE INDEX idx_wallet_transactions_shopkeeper ON wallet_transactions(shopkeeper_id);
CREATE INDEX idx_wallet_transactions_task ON wallet_transactions(task_id);
CREATE INDEX idx_wallet_transactions_campaign ON wallet_transactions(campaign_id);
CREATE INDEX idx_wallet_transactions_date ON wallet_transactions(transaction_date DESC);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- Automatically update updated_at timestamp on row changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shopkeepers_updated_at BEFORE UPDATE ON shopkeepers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shelf_spaces_updated_at BEFORE UPDATE ON shelf_spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active campaigns with remaining budget
CREATE VIEW active_campaigns AS
SELECT 
  c.*,
  COUNT(t.id) as total_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
  SUM(t.earnings) FILTER (WHERE t.status = 'completed') as total_spent
FROM campaigns c
LEFT JOIN tasks t ON c.id = t.campaign_id
WHERE c.status = 'active' 
  AND c.remaining_budget > 0
  AND c.start_date <= CURRENT_TIMESTAMP
  AND c.end_date >= CURRENT_TIMESTAMP
GROUP BY c.id;

-- Shopkeeper dashboard summary
CREATE VIEW shopkeeper_dashboard AS
SELECT 
  s.id,
  s.shopkeeper_id,
  s.name,
  s.wallet_balance,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'assigned') as pending_tasks,
  SUM(wt.amount) FILTER (WHERE wt.type = 'earning' AND wt.transaction_date >= CURRENT_DATE) as today_earnings,
  SUM(wt.amount) FILTER (WHERE wt.type = 'earning' AND wt.transaction_date >= CURRENT_DATE - INTERVAL '7 days') as weekly_earnings
FROM shopkeepers s
LEFT JOIN tasks t ON s.id = t.shopkeeper_id
LEFT JOIN wallet_transactions wt ON s.id = wt.shopkeeper_id
GROUP BY s.id;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE shopkeepers IS 'Stores shopkeeper profiles and account information';
COMMENT ON TABLE shelf_spaces IS 'Stores shelf analysis results from Bedrock vision AI';
COMMENT ON TABLE campaigns IS 'Stores brand campaigns with budget allocation and targeting';
COMMENT ON TABLE tasks IS 'Stores product placement tasks assigned to shopkeepers';
COMMENT ON TABLE wallet_transactions IS 'Stores all financial transactions for audit trail';

COMMENT ON COLUMN shopkeepers.store_location IS 'Geographic coordinates (latitude, longitude) for campaign matching';
COMMENT ON COLUMN campaigns.target_locations IS 'Array of location strings for campaign targeting';
COMMENT ON COLUMN campaigns.target_radius_km IS 'Radius in kilometers for location-based matching';
COMMENT ON COLUMN tasks.verification_result IS 'JSON result from Bedrock vision verification';
