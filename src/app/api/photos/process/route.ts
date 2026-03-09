/**
 * API Route: Process Uploaded Photo
 * POST /api/photos/process
 * 
 * Processes uploaded photos: compression, optimization, and metadata extraction
 * Task 4.1: Store photo metadata in PostgreSQL
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractPhotoMetadata,
  validatePhotoMetadata,
  generatePhotoId,
  optimizeForWeb,
  generateImageVariants,
} from '@/lib/storage';
import type { DeviceInfo, LocationInfo } from '@/lib/storage';
import { query } from '@/lib/db/postgres/client';

/**
 * Request body interface
 */
interface ProcessPhotoRequest {
  shopkeeperId: string;
  photoType: 'shelf' | 'proof';
  s3Key: string;
  s3Url: string;
  imageData: string; // Base64 encoded image data
  deviceInfo?: DeviceInfo;
  locationInfo?: LocationInfo;
  generateVariants?: boolean;
}

/**
 * POST handler for processing uploaded photos
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ProcessPhotoRequest = await request.json();
    const {
      shopkeeperId,
      photoType,
      s3Key,
      s3Url,
      imageData,
      deviceInfo,
      locationInfo,
      generateVariants = false,
    } = body;

    // Validate required fields
    if (!shopkeeperId || !photoType || !s3Key || !s3Url || !imageData) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details:
            'shopkeeperId, photoType, s3Key, s3Url, and imageData are required',
        },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Generate photo ID
    const photoId = generatePhotoId(shopkeeperId);

    // Extract metadata
    const metadata = await extractPhotoMetadata(
      imageBuffer,
      photoId,
      shopkeeperId,
      photoType,
      s3Key,
      s3Url,
      deviceInfo,
      locationInfo
    );

    // Validate metadata
    const validation = validatePhotoMetadata(metadata);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid photo metadata',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Optimize image for web
    const optimized = await optimizeForWeb(imageBuffer);
    metadata.compressedSize = optimized.optimizedSize;
    metadata.compressionRatio = optimized.compressionRatio;

    // Store metadata in PostgreSQL
    try {
      // Get shopkeeper UUID from shopkeeper_id
      const shopkeeperResult = await query(
        'SELECT id FROM shopkeepers WHERE shopkeeper_id = $1',
        [shopkeeperId]
      );

      if (shopkeeperResult.rows.length === 0) {
        console.warn(`[Photo Process] Shopkeeper not found: ${shopkeeperId}`);
      } else {
        const shopkeeperUuid = shopkeeperResult.rows[0].id;
        
        // Import dynamically to avoid circular dependencies
        const { createPhotoMetadata } = await import('@/lib/db/postgres/photo-operations');
        
        await createPhotoMetadata(metadata, shopkeeperUuid);
        console.log(`[Photo Process] ✅ Metadata stored in PostgreSQL for photo: ${photoId}`);
      }
    } catch (dbError) {
      // Log error but don't fail the request
      console.error('[Photo Process] ⚠️  Failed to store metadata in PostgreSQL:', dbError);
    }

    // Generate variants if requested
    let variants;
    if (generateVariants) {
      const imageVariants = await generateImageVariants(imageBuffer);
      variants = {
        compressed: imageVariants.compressed.toString('base64'),
        thumbnail: imageVariants.thumbnail.toString('base64'),
        lowBandwidth: imageVariants.lowBandwidth.toString('base64'),
      };
    }

    // Return processed metadata and variants
    return NextResponse.json({
      success: true,
      data: {
        metadata,
        optimized: {
          format: optimized.format,
          originalSize: optimized.originalSize,
          optimizedSize: optimized.optimizedSize,
          compressionRatio: optimized.compressionRatio,
        },
        variants: variants || null,
      },
    });
  } catch (error) {
    console.error('Error processing photo:', error);
    return NextResponse.json(
      {
        error: 'Failed to process photo',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
