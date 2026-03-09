/**
 * API Route: Photo Metadata
 * GET /api/photos/metadata
 * 
 * Retrieves photo metadata from PostgreSQL
 * Task 4.1: S3 direct upload system with metadata storage
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPhotoMetadata,
  getShopkeeperPhotos,
  getPhotoStatistics,
} from '@/lib/db/postgres/photo-operations';
import { query } from '@/lib/db/postgres/client';

/**
 * GET handler for retrieving photo metadata
 * Query parameters:
 * - photoId: Get specific photo metadata
 * - shopkeeperId: Get all photos for a shopkeeper
 * - photoType: Filter by photo type (shelf or proof)
 * - stats: Get photo statistics for a shopkeeper
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');
    const shopkeeperId = searchParams.get('shopkeeperId');
    const photoType = searchParams.get('photoType') as 'shelf' | 'proof' | null;
    const stats = searchParams.get('stats') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get specific photo metadata
    if (photoId) {
      const metadata = await getPhotoMetadata(photoId);
      
      if (!metadata) {
        return NextResponse.json(
          { error: 'Photo not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: metadata,
      });
    }

    // Get shopkeeper photos or statistics
    if (shopkeeperId) {
      // Get shopkeeper UUID
      const shopkeeperResult = await query(
        'SELECT id FROM shopkeepers WHERE shopkeeper_id = $1',
        [shopkeeperId]
      );

      if (shopkeeperResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Shopkeeper not found' },
          { status: 404 }
        );
      }

      const shopkeeperUuid = shopkeeperResult.rows[0].id;

      // Return statistics if requested
      if (stats) {
        const statistics = await getPhotoStatistics(shopkeeperUuid);
        return NextResponse.json({
          success: true,
          data: statistics,
        });
      }

      // Return photos list
      const photos = await getShopkeeperPhotos(
        shopkeeperUuid,
        photoType || undefined,
        limit,
        offset
      );

      return NextResponse.json({
        success: true,
        data: {
          photos,
          pagination: {
            limit,
            offset,
            count: photos.length,
          },
        },
      });
    }

    // Missing required parameters
    return NextResponse.json(
      {
        error: 'Missing required parameters',
        details: 'Provide either photoId or shopkeeperId',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error retrieving photo metadata:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve photo metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
