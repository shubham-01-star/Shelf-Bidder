# Photo Storage Module

This module provides comprehensive photo upload, storage, compression, and metadata management for the Shelf-Bidder application.

## Features

- **S3 Upload with Presigned URLs**: Secure, direct-to-S3 uploads without exposing credentials
- **Image Compression**: Automatic optimization for web delivery and low-bandwidth scenarios
- **Metadata Extraction**: Comprehensive photo metadata including dimensions, format, and device info
- **Multiple Image Variants**: Generate thumbnails and low-bandwidth versions automatically
- **Client-side Upload**: Browser-based upload utilities with progress tracking

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Request presigned URL
       ▼
┌─────────────────────┐
│  /api/photos/       │
│  upload-url         │
└──────┬──────────────┘
       │ 2. Return presigned URL
       ▼
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 3. Upload directly to S3
       ▼
┌─────────────┐
│     S3      │
└─────────────┘
       │ 4. Process photo
       ▼
┌─────────────────────┐
│  /api/photos/       │
│  process            │
└─────────────────────┘
```

## Usage

### Client-side Upload

```typescript
import { uploadPhoto, validateFile } from '@/lib/storage/client-upload';

// Validate file before upload
const validation = validateFile(file);
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Upload with progress tracking
const result = await uploadPhoto(
  file,
  'shopkeeper-123',
  'shelf',
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);

if (result.success) {
  console.log('Photo uploaded:', result.photoUrl);
  console.log('Metadata:', result.metadata);
} else {
  console.error('Upload failed:', result.error);
}
```

### Server-side Processing

```typescript
import {
  generatePresignedUploadUrl,
  extractPhotoMetadata,
  optimizeForWeb,
  PhotoType,
} from '@/lib/storage';

// Generate presigned URL
const { uploadUrl, photoKey, photoUrl } = await generatePresignedUploadUrl(
  'shopkeeper-123',
  PhotoType.SHELF,
  'jpg',
  300 // 5 minutes expiration
);

// Extract metadata after upload
const metadata = await extractPhotoMetadata(
  imageBuffer,
  photoId,
  shopkeeperId,
  'shelf',
  photoKey,
  photoUrl
);

// Optimize for web delivery
const optimized = await optimizeForWeb(imageBuffer);
console.log(`Compressed ${optimized.compressionRatio}%`);
```

## API Routes

### POST /api/photos/upload-url

Generate a presigned URL for uploading photos to S3.

**Request:**
```json
{
  "shopkeeperId": "shop123",
  "photoType": "shelf",
  "filename": "photo.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 1048576
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://...",
    "photoKey": "shelf/shop123/1234567890.jpg",
    "photoUrl": "https://...",
    "expiresIn": 300
  }
}
```

### POST /api/photos/process

Process uploaded photo: extract metadata, compress, and generate variants.

**Request:**
```json
{
  "shopkeeperId": "shop123",
  "photoType": "shelf",
  "s3Key": "shelf/shop123/1234567890.jpg",
  "s3Url": "https://...",
  "imageData": "data:image/jpeg;base64,...",
  "deviceInfo": {
    "userAgent": "...",
    "platform": "...",
    "screenWidth": 1920,
    "screenHeight": 1080
  },
  "generateVariants": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "photoId": "photo_shop123_1234567890",
      "width": 1920,
      "height": 1080,
      "format": "jpeg",
      "fileSize": 1048576,
      "compressionRatio": 45.2
    },
    "optimized": {
      "format": "webp",
      "originalSize": 1048576,
      "optimizedSize": 574464,
      "compressionRatio": 45.2
    },
    "variants": {
      "compressed": "base64...",
      "thumbnail": "base64...",
      "lowBandwidth": "base64..."
    }
  }
}
```

## Configuration

Set the following environment variables:

```env
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_ACCOUNT_ID=123456789012

# S3 Bucket
NEXT_PUBLIC_PHOTO_BUCKET_NAME=shelf-bidder-photos-123456789012
```

## File Size Limits

- Maximum photo size: **20MB** (as per design requirements)
- Allowed formats: JPEG, PNG, WebP
- Recommended dimensions: 1920x1080 or lower

## Compression

The module automatically compresses images based on use case:

- **High Quality** (90%): Standard viewing
- **Medium Quality** (75%): Thumbnails
- **Low Quality** (60%): Low-bandwidth scenarios (3G connections)

## Image Variants

When `generateVariants: true` is specified, the system creates:

1. **Compressed**: High-quality version (1920x1080 max)
2. **Thumbnail**: Preview version (400x300 max)
3. **Low Bandwidth**: Optimized for 3G (800x600 max, WebP format)

## Storage Lifecycle

Photos are stored in S3 with the following lifecycle:

- **0-30 days**: S3 Standard storage
- **30-90 days**: S3 Infrequent Access
- **90+ days**: Automatically deleted

## Testing

Run tests with:

```bash
npm test -- src/lib/storage/__tests__
```

## Error Handling

All functions include comprehensive error handling:

- File validation errors
- S3 upload failures
- Image processing errors
- Metadata validation errors

Errors are returned with descriptive messages for debugging.

## Performance

- Presigned URLs expire in 5 minutes (configurable)
- Image compression uses mozjpeg for optimal results
- Parallel processing for image variants
- Efficient buffer handling for large files

## Security

- Presigned URLs prevent credential exposure
- S3 bucket has public access blocked
- CORS configured for specific origins
- File type validation prevents malicious uploads
- Size limits prevent abuse
