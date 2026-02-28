/**
 * Storage Module
 * Exports all photo storage, upload, compression, and metadata utilities
 */

// S3 Client
export { s3Client, PHOTO_BUCKET_NAME, MAX_PHOTO_SIZE, ALLOWED_PHOTO_TYPES } from './s3-client';

// Upload utilities
export {
  PhotoType,
  generatePresignedUploadUrl,
  generatePresignedViewUrl,
  getPhotoMetadata as getS3PhotoMetadata,
  getObject,
  validatePhotoFile,
  getFileExtension,
} from './upload';

// Compression utilities
export {
  CompressionQuality,
  compressImage,
  generateImageVariants,
  extractImageMetadata,
  optimizeForWeb,
  toBase64DataUrl,
  fromBase64DataUrl,
} from './compression';
export type { ImageDimensions, CompressionOptions } from './compression';

// Metadata utilities
export {
  extractPhotoMetadata,
  validatePhotoMetadata,
  generatePhotoId,
  parsePhotoId,
  estimateStorageCost,
  getMetadataSummary,
} from './metadata';
export type { PhotoMetadata, DeviceInfo, LocationInfo } from './metadata';
