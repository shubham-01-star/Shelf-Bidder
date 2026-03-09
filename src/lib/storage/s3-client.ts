/**
 * S3 Client Configuration
 * Provides configured S3 client for photo storage operations
 */

import { S3Client } from '@aws-sdk/client-s3';

// Get AWS configuration from environment variables
const region =
  process.env.AWS_REGION ||
  process.env.NEXT_PUBLIC_AWS_REGION ||
  'us-east-1';
const credentials = process.env.AWS_ACCESS_KEY_ID
  ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    }
  : undefined;

/**
 * Configured S3 client instance
 * Uses environment variables for credentials and region
 */
export const s3Client = new S3Client({
  region,
  credentials,
});

/**
 * S3 bucket name for photo storage
 */
export const PHOTO_BUCKET_NAME =
  process.env.NEXT_PUBLIC_PHOTO_BUCKET ||
  process.env.PHOTO_BUCKET_NAME ||
  process.env.S3_BUCKET_PHOTOS ||
  `shelf-bidder-photos-${process.env.AWS_ACCOUNT_ID || 'dev'}`;

console.log('[S3 Client] 📦 Bucket name:', PHOTO_BUCKET_NAME);
console.log('[S3 Client] 🔍 Environment check:', {
  NEXT_PUBLIC_PHOTO_BUCKET: process.env.NEXT_PUBLIC_PHOTO_BUCKET,
  PHOTO_BUCKET_NAME: process.env.PHOTO_BUCKET_NAME,
  S3_BUCKET_PHOTOS: process.env.S3_BUCKET_PHOTOS,
});

/**
 * Maximum photo file size (20MB as per design)
 */
export const MAX_PHOTO_SIZE = 20 * 1024 * 1024; // 20MB in bytes

/**
 * Allowed photo MIME types
 */
export const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
