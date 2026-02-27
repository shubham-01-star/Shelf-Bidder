/**
 * API Route: Generate Presigned Upload URL
 * POST /api/photos/upload-url
 * 
 * Generates a presigned URL for uploading photos to S3
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generatePresignedUploadUrl,
  PhotoType,
  getFileExtension,
  MAX_PHOTO_SIZE,
  ALLOWED_PHOTO_TYPES,
} from '@/lib/storage';

/**
 * Request body interface
 */
interface UploadUrlRequest {
  shopkeeperId: string;
  photoType: 'shelf' | 'proof';
  filename: string;
  mimeType: string;
  fileSize: number;
}

/**
 * POST handler for generating presigned upload URLs
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: UploadUrlRequest = await request.json();
    const { shopkeeperId, photoType, filename, mimeType, fileSize } = body;

    // Validate required fields
    if (!shopkeeperId || !photoType || !filename || !mimeType) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'shopkeeperId, photoType, filename, and mimeType are required',
        },
        { status: 400 }
      );
    }

    // Validate photo type
    if (!['shelf', 'proof'].includes(photoType)) {
      return NextResponse.json(
        {
          error: 'Invalid photo type',
          details: 'photoType must be either "shelf" or "proof"',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_PHOTO_SIZE) {
      return NextResponse.json(
        {
          error: 'File size exceeds limit',
          details: `Maximum file size is ${MAX_PHOTO_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_PHOTO_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          details: `Allowed types: ${ALLOWED_PHOTO_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Extract file extension
    const fileExtension = getFileExtension(filename, mimeType);

    // Generate presigned URL
    const result = await generatePresignedUploadUrl(
      shopkeeperId,
      photoType === 'shelf' ? PhotoType.SHELF : PhotoType.PROOF,
      fileExtension,
      300 // 5 minutes expiration
    );

    // Return presigned URL and metadata
    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        photoKey: result.photoKey,
        photoUrl: result.photoUrl,
        expiresIn: 300,
      },
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
