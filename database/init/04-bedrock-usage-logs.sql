-- ============================================================================
-- Bedrock Usage Logs Table
-- Task 4.2: Multi-model fallback chain logging and monitoring
-- ============================================================================

CREATE TABLE bedrock_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('analysis', 'verification')),
  shopkeeper_id UUID REFERENCES shopkeepers(id) ON DELETE SET NULL,
  response_time_ms INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for bedrock_usage_logs
CREATE INDEX idx_bedrock_logs_model ON bedrock_usage_logs(model);
CREATE INDEX idx_bedrock_logs_status ON bedrock_usage_logs(status);
CREATE INDEX idx_bedrock_logs_timestamp ON bedrock_usage_logs(timestamp DESC);
CREATE INDEX idx_bedrock_logs_shopkeeper ON bedrock_usage_logs(shopkeeper_id);

-- Index for consecutive failure detection (optimized for recent failures)
CREATE INDEX idx_bedrock_recent_failures ON bedrock_usage_logs(timestamp DESC, status) 
WHERE status = 'failure';

-- Comments
COMMENT ON TABLE bedrock_usage_logs IS 'Logs all Bedrock model invocations for monitoring and alerting';
COMMENT ON COLUMN bedrock_usage_logs.model IS 'Bedrock model ID (e.g., amazon.nova-pro-v1:0)';
COMMENT ON COLUMN bedrock_usage_logs.request_type IS 'Type of request: analysis (shelf photo) or verification (proof photo)';
COMMENT ON COLUMN bedrock_usage_logs.response_time_ms IS 'Response time in milliseconds';
