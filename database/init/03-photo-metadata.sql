-- ============================================================================
-- Photo Metadata Table
-- Stores comprehensive metadata for all uploaded photos
-- Task 4.1: S3 direct upload system with metadata storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS photo_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id VARCHAR(255) UNIQUE NOT NULL,
  shopkeeper_id UUID NOT NULL REFERENCES shopkeepers(id) ON DELETE CASCADE,
  photo_type VARCHAR(10) NOT NULL CHECK (photo_type IN ('shelf', 'proof')),
  
  -- S3 Storage Information
  s3_key TEXT NOT NULL,
  s3_url TEXT NOT NULL,
  s3_bucket VARCHAR(255) NOT NULL,
  
  -- Photo Dimensions and Format
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  original_size BIGINT NOT NULL CHECK (original_size > 0),
  compressed_size BIGINT,
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  format VARCHAR(10) NOT NULL,
  has_alpha BOOLEAN DEFAULT false,
  orientation INTEGER,
  compression_ratio DECIMAL(5,2),
  
  -- Device Information (optional)
  device_info JSONB,
  
  -- Location Information (optional)
  location_info JSONB,
  
  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for photo_metadata
CREATE INDEX idx_photo_metadata_shopkeeper ON photo_metadata(shopkeeper_id);
CREATE INDEX idx_photo_metadata_photo_id ON photo_metadata(photo_id);
CREATE INDEX idx_photo_metadata_photo_type ON photo_metadata(photo_type);
CREATE INDEX idx_photo_metadata_uploaded_at ON photo_metadata(uploaded_at DESC);
CREATE INDEX idx_photo_metadata_s3_key ON photo_metadata(s3_key);

-- Trigger for updated_at
CREATE TRIGGER update_photo_metadata_updated_at BEFORE UPDATE ON photo_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE photo_metadata IS 'Stores comprehensive metadata for all uploaded photos (shelf and proof)';
COMMENT ON COLUMN photo_metadata.photo_id IS 'Unique identifier generated from shopkeeper_id and timestamp';
COMMENT ON COLUMN photo_metadata.s3_key IS 'S3 object key for the photo';
COMMENT ON COLUMN photo_metadata.device_info IS 'JSON object containing device information (userAgent, platform, screen dimensions)';
COMMENT ON COLUMN photo_metadata.location_info IS 'JSON object containing GPS coordinates if available';
COMMENT ON COLUMN photo_metadata.compression_ratio IS 'Percentage reduction from original to compressed size';
