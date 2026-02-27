/**
 * Photo Metadata Extraction and Storage
 * Handles extraction and persistence of photo metadata
 */

import { extractImageMetadata } from './compression';

/**
 * Photo metadata interface
 */
export interface PhotoMetadata {
  photoId: string;
  shopkeeperId: string;
  photoType: 'shelf' | 'proof';
  s3Key: string;
  s3Url: string;
  uploadedAt: string;
  fileSize: number;
  originalSize: number;
  compressedSize?: number;
  width: number;
  height: number;
  format: string;
  hasAlpha: boolean;
  orientation?: number;
  compressionRatio?: number;
  deviceInfo?: DeviceInfo;
  locationInfo?: LocationInfo;
}

/**
 * Device information captured during photo upload
 */
export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  screenWidth?: number;
  screenHeight?: number;
  devicePixelRatio?: number;
}

/**
 * Location information (if available)
 */
export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp?: string;
}

/**
 * Extract comprehensive metadata from photo buffer
 * @param imageBuffer - Image buffer
 * @param photoId - Unique photo identifier
 * @param shopkeeperId - Shopkeeper ID
 * @param photoType - Type of photo
 * @param s3Key - S3 storage key
 * @param s3Url - S3 URL
 * @param deviceInfo - Optional device information
 * @param locationInfo - Optional location information
 * @returns Complete photo metadata
 */
export async function extractPhotoMetadata(
  imageBuffer: Buffer,
  photoId: string,
  shopkeeperId: string,
  photoType: 'shelf' | 'proof',
  s3Key: string,
  s3Url: string,
  deviceInfo?: DeviceInfo,
  locationInfo?: LocationInfo
): Promise<PhotoMetadata> {
  const imageMetadata = await extractImageMetadata(imageBuffer);

  return {
    photoId,
    shopkeeperId,
    photoType,
    s3Key,
    s3Url,
    uploadedAt: new Date().toISOString(),
    fileSize: imageMetadata.size,
    originalSize: imageMetadata.size,
    width: imageMetadata.width,
    height: imageMetadata.height,
    format: imageMetadata.format,
    hasAlpha: imageMetadata.hasAlpha,
    orientation: imageMetadata.orientation,
    deviceInfo,
    locationInfo,
  };
}

/**
 * Validate photo metadata
 * @param metadata - Photo metadata to validate
 * @returns Validation result
 */
export function validatePhotoMetadata(metadata: PhotoMetadata): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate required fields
  if (!metadata.photoId) errors.push('Photo ID is required');
  if (!metadata.shopkeeperId) errors.push('Shopkeeper ID is required');
  if (!metadata.photoType) errors.push('Photo type is required');
  if (!metadata.s3Key) errors.push('S3 key is required');
  if (!metadata.s3Url) errors.push('S3 URL is required');

  // Validate dimensions
  if (metadata.width <= 0) errors.push('Invalid width');
  if (metadata.height <= 0) errors.push('Invalid height');

  // Validate file size
  if (metadata.fileSize <= 0) errors.push('Invalid file size');
  if (metadata.fileSize > 20 * 1024 * 1024) {
    errors.push('File size exceeds 20MB limit');
  }

  // Validate photo type
  if (!['shelf', 'proof'].includes(metadata.photoType)) {
    errors.push('Invalid photo type');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate photo ID from shopkeeper ID and timestamp
 * @param shopkeeperId - Shopkeeper ID
 * @param timestamp - Optional timestamp (defaults to current time)
 * @returns Unique photo ID
 */
export function generatePhotoId(
  shopkeeperId: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  return `photo_${shopkeeperId}_${ts}`;
}

/**
 * Parse photo ID to extract components
 * @param photoId - Photo ID to parse
 * @returns Parsed components or null if invalid
 */
export function parsePhotoId(photoId: string): {
  shopkeeperId: string;
  timestamp: number;
} | null {
  const match = photoId.match(/^photo_(.+)_(\d+)$/);
  if (!match) return null;

  return {
    shopkeeperId: match[1],
    timestamp: parseInt(match[2], 10),
  };
}

/**
 * Calculate storage cost estimate based on photo metadata
 * @param metadata - Photo metadata
 * @param storageMonths - Number of months to store (default: 3)
 * @returns Estimated storage cost in USD
 */
export function estimateStorageCost(
  metadata: PhotoMetadata,
  storageMonths: number = 3
): number {
  // S3 Standard storage cost: $0.023 per GB per month
  const costPerGBMonth = 0.023;
  const sizeInGB = metadata.fileSize / (1024 * 1024 * 1024);
  return sizeInGB * costPerGBMonth * storageMonths;
}

/**
 * Get photo metadata summary for display
 * @param metadata - Photo metadata
 * @returns Human-readable summary
 */
export function getMetadataSummary(metadata: PhotoMetadata): {
  size: string;
  dimensions: string;
  format: string;
  uploadDate: string;
  compressionInfo?: string;
} {
  const sizeInMB = (metadata.fileSize / (1024 * 1024)).toFixed(2);
  const uploadDate = new Date(metadata.uploadedAt).toLocaleString();

  let compressionInfo: string | undefined;
  if (metadata.compressionRatio) {
    compressionInfo = `${metadata.compressionRatio.toFixed(1)}% reduction`;
  }

  return {
    size: `${sizeInMB} MB`,
    dimensions: `${metadata.width} x ${metadata.height}`,
    format: metadata.format.toUpperCase(),
    uploadDate,
    compressionInfo,
  };
}
