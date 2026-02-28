/**
 * Photo Upload Utilities
 * Handles S3 upload operations with presigned URLs
 */

import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, PHOTO_BUCKET_NAME, MAX_PHOTO_SIZE } from './s3-client';

/**
 * Photo type enum for organizing photos in S3
 */
export enum PhotoType {
  SHELF = 'shelf',
  PROOF = 'proof',
}

/**
 * Generate a presigned URL for uploading a photo to S3
 * @param shopkeeperId - ID of the shopkeeper uploading the photo
 * @param photoType - Type of photo (shelf or proof)
 * @param fileExtension - File extension (jpg, png, etc.)
 * @param expiresIn - URL expiration time in seconds (default: 5 minutes)
 * @returns Presigned URL and S3 key
 */
export async function generatePresignedUploadUrl(
  shopkeeperId: string,
  photoType: PhotoType,
  fileExtension: string,
  expiresIn: number = 300
): Promise<{ uploadUrl: string; photoKey: string; photoUrl: string }> {
  // Generate unique photo key with timestamp
  const timestamp = Date.now();
  const photoKey = `${photoType}/${shopkeeperId}/${timestamp}.${fileExtension}`;

  // Create PutObject command
  const command = new PutObjectCommand({
    Bucket: PHOTO_BUCKET_NAME,
    Key: photoKey,
    ContentType: `image/${fileExtension}`,
    Metadata: {
      shopkeeperId,
      photoType,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Generate presigned URL
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  // Generate the final photo URL (without presigning for GET)
  const photoUrl = `https://${PHOTO_BUCKET_NAME}.s3.amazonaws.com/${photoKey}`;

  return {
    uploadUrl,
    photoKey,
    photoUrl,
  };
}

/**
 * Generate a presigned URL for downloading/viewing a photo from S3
 * @param photoKey - S3 key of the photo
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL for viewing the photo
 */
export async function generatePresignedViewUrl(
  photoKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: PHOTO_BUCKET_NAME,
    Key: photoKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get photo object (download) from S3
 * @param photoKey - S3 key of the photo
 * @returns Photo data as Buffer
 */
export async function getObject(photoKey: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: PHOTO_BUCKET_NAME,
    Key: photoKey,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error(`No data returned for photo key: ${photoKey}`);
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Get photo metadata from S3
 * @param photoKey - S3 key of the photo
 * @returns Photo metadata including size, content type, and custom metadata
 */
export async function getPhotoMetadata(photoKey: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
  metadata: Record<string, string>;
}> {
  const command = new HeadObjectCommand({
    Bucket: PHOTO_BUCKET_NAME,
    Key: photoKey,
  });

  const response = await s3Client.send(command);

  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType || 'application/octet-stream',
    lastModified: response.LastModified || new Date(),
    metadata: response.Metadata || {},
  };
}

/**
 * Validate photo file before upload
 * @param file - File object to validate
 * @returns Validation result with error message if invalid
 */
export function validatePhotoFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > MAX_PHOTO_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_PHOTO_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Extract file extension from filename or MIME type
 * @param filename - Original filename
 * @param mimeType - MIME type of the file
 * @returns File extension without dot
 */
export function getFileExtension(filename: string, mimeType: string): string {
  // Try to get extension from filename
  const match = filename.match(/\.([^.]+)$/);
  if (match) {
    return match[1].toLowerCase();
  }

  // Fallback to MIME type mapping
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  return mimeToExt[mimeType] || 'jpg';
}
