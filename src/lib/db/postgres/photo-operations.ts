/**
 * PostgreSQL Photo Metadata Operations
 * Task 4.1: S3 direct upload system with metadata storage
 */

import { query, transaction } from './client';
import type { PhotoMetadata } from '@/lib/storage';

/**
 * Photo metadata database record
 */
export interface PhotoMetadataRecord {
  id: string;
  photo_id: string;
  shopkeeper_id: string;
  photo_type: 'shelf' | 'proof';
  s3_key: string;
  s3_url: string;
  s3_bucket: string;
  file_size: number;
  original_size: number;
  compressed_size?: number;
  width: number;
  height: number;
  format: string;
  has_alpha: boolean;
  orientation?: number;
  compression_ratio?: number;
  device_info?: Record<string, any>;
  location_info?: Record<string, any>;
  uploaded_at: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create photo metadata record
 */
export async function createPhotoMetadata(
  metadata: PhotoMetadata,
  shopkeeperUuid: string
): Promise<PhotoMetadataRecord> {
  const result = await query<PhotoMetadataRecord>(
    `INSERT INTO photo_metadata (
      photo_id,
      shopkeeper_id,
      photo_type,
      s3_key,
      s3_url,
      s3_bucket,
      file_size,
      original_size,
      compressed_size,
      width,
      height,
      format,
      has_alpha,
      orientation,
      compression_ratio,
      device_info,
      location_info,
      uploaded_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
      metadata.photoId,
      shopkeeperUuid,
      metadata.photoType,
      metadata.s3Key,
      metadata.s3Url,
      process.env.PHOTO_BUCKET_NAME || process.env.NEXT_PUBLIC_PHOTO_BUCKET || 'shelf-bidder-photos',
      metadata.fileSize,
      metadata.originalSize,
      metadata.compressedSize || null,
      metadata.width,
      metadata.height,
      metadata.format,
      metadata.hasAlpha,
      metadata.orientation || null,
      metadata.compressionRatio || null,
      metadata.deviceInfo ? JSON.stringify(metadata.deviceInfo) : null,
      metadata.locationInfo ? JSON.stringify(metadata.locationInfo) : null,
      metadata.uploadedAt,
    ]
  );

  return result.rows[0];
}

/**
 * Get photo metadata by photo ID
 */
export async function getPhotoMetadata(photoId: string): Promise<PhotoMetadataRecord | null> {
  const result = await query<PhotoMetadataRecord>(
    'SELECT * FROM photo_metadata WHERE photo_id = $1',
    [photoId]
  );

  return result.rows[0] || null;
}

/**
 * Get photo metadata by S3 key
 */
export async function getPhotoMetadataByS3Key(s3Key: string): Promise<PhotoMetadataRecord | null> {
  const result = await query<PhotoMetadataRecord>(
    'SELECT * FROM photo_metadata WHERE s3_key = $1',
    [s3Key]
  );

  return result.rows[0] || null;
}

/**
 * Get all photos for a shopkeeper
 */
export async function getShopkeeperPhotos(
  shopkeeperUuid: string,
  photoType?: 'shelf' | 'proof',
  limit: number = 50,
  offset: number = 0
): Promise<PhotoMetadataRecord[]> {
  let queryText = `
    SELECT * FROM photo_metadata 
    WHERE shopkeeper_id = $1
  `;
  const params: any[] = [shopkeeperUuid];

  if (photoType) {
    queryText += ' AND photo_type = $2';
    params.push(photoType);
    queryText += ' ORDER BY uploaded_at DESC LIMIT $3 OFFSET $4';
    params.push(limit, offset);
  } else {
    queryText += ' ORDER BY uploaded_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);
  }

  const result = await query<PhotoMetadataRecord>(queryText, params);
  return result.rows;
}

/**
 * Update photo metadata (e.g., after compression)
 */
export async function updatePhotoMetadata(
  photoId: string,
  updates: {
    compressed_size?: number;
    compression_ratio?: number;
  }
): Promise<PhotoMetadataRecord | null> {
  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (updates.compressed_size !== undefined) {
    setClauses.push(`compressed_size = $${paramIndex++}`);
    params.push(updates.compressed_size);
  }

  if (updates.compression_ratio !== undefined) {
    setClauses.push(`compression_ratio = $${paramIndex++}`);
    params.push(updates.compression_ratio);
  }

  if (setClauses.length === 0) {
    return getPhotoMetadata(photoId);
  }

  params.push(photoId);

  const result = await query<PhotoMetadataRecord>(
    `UPDATE photo_metadata 
     SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE photo_id = $${paramIndex}
     RETURNING *`,
    params
  );

  return result.rows[0] || null;
}

/**
 * Delete photo metadata
 */
export async function deletePhotoMetadata(photoId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM photo_metadata WHERE photo_id = $1',
    [photoId]
  );

  return (result.rowCount || 0) > 0;
}

/**
 * Get photo statistics for a shopkeeper
 */
export async function getPhotoStatistics(shopkeeperUuid: string): Promise<{
  total_photos: number;
  shelf_photos: number;
  proof_photos: number;
  total_storage_bytes: number;
  average_file_size: number;
  average_compression_ratio: number;
}> {
  const result = await query<{
    total_photos: string;
    shelf_photos: string;
    proof_photos: string;
    total_storage_bytes: string;
    average_file_size: string;
    average_compression_ratio: string;
  }>(
    `SELECT 
      COUNT(*) as total_photos,
      COUNT(*) FILTER (WHERE photo_type = 'shelf') as shelf_photos,
      COUNT(*) FILTER (WHERE photo_type = 'proof') as proof_photos,
      SUM(file_size) as total_storage_bytes,
      AVG(file_size) as average_file_size,
      AVG(compression_ratio) as average_compression_ratio
    FROM photo_metadata
    WHERE shopkeeper_id = $1`,
    [shopkeeperUuid]
  );

  const row = result.rows[0];
  return {
    total_photos: parseInt(row.total_photos) || 0,
    shelf_photos: parseInt(row.shelf_photos) || 0,
    proof_photos: parseInt(row.proof_photos) || 0,
    total_storage_bytes: parseInt(row.total_storage_bytes) || 0,
    average_file_size: parseFloat(row.average_file_size) || 0,
    average_compression_ratio: parseFloat(row.average_compression_ratio) || 0,
  };
}
