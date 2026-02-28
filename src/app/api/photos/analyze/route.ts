/**
 * API Route: Analyze Shelf Photo
 * POST /api/photos/analyze
 * 
 * Analyzes shelf photos using Claude 3.5 Vision to identify empty spaces and inventory
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeShelfSpace, AnalysisError } from '@/lib/vision';
import { getObject } from '@/lib/storage';

/**
 * Request body interface
 */
interface AnalyzePhotoRequest {
  shopkeeperId: string;
  photoUrl: string;
  s3Key?: string;
  imageData?: string; // Base64 encoded image data (alternative to S3)
  mimeType?: string;
}

/**
 * POST handler for analyzing shelf photos
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: AnalyzePhotoRequest = await request.json();
    const { shopkeeperId, photoUrl, s3Key, imageData, mimeType = 'image/jpeg' } = body;

    // Validate required fields
    if (!shopkeeperId) {
      return NextResponse.json(
        {
          error: 'Missing required field: shopkeeperId',
        },
        { status: 400 }
      );
    }

    if (!photoUrl && !imageData) {
      return NextResponse.json(
        {
          error: 'Either photoUrl or imageData must be provided',
        },
        { status: 400 }
      );
    }

    // Get image buffer
    let imageBuffer: Buffer;

    if (imageData) {
      // Use provided base64 image data
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (s3Key) {
      // Download from S3 using key
      imageBuffer = await getObject(s3Key);
    } else {
      // Download from S3 using URL
      const key = extractS3KeyFromUrl(photoUrl);
      imageBuffer = await getObject(key);
    }

    // Validate image size (max 20MB)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (imageBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        {
          error: 'Image too large',
          details: `Image size ${imageBuffer.length} bytes exceeds maximum ${MAX_SIZE} bytes`,
        },
        { status: 400 }
      );
    }

    // Analyze shelf space
    const result = await analyzeShelfSpace(imageBuffer, mimeType);

    const totalTime = Date.now() - startTime;

    // Check if analysis meets performance requirement (30 seconds)
    if (totalTime > 30000) {
      console.warn(
        `Analysis took ${totalTime}ms, exceeding 30s requirement (Requirement 2.2)`
      );
    }

    // Return analysis results
    return NextResponse.json({
      success: true,
      data: {
        shopkeeperId,
        photoUrl,
        emptySpaces: result.emptySpaces,
        currentInventory: result.currentInventory,
        analysisConfidence: result.analysisConfidence,
        processingTime: result.processingTime,
        totalTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;

    // Handle specific analysis errors
    if (error instanceof AnalysisError) {
      console.error('Analysis error:', error.code, error.details);
      return NextResponse.json(
        {
          error: 'Analysis failed',
          code: error.code,
          message: error.message,
          details: error.details,
          totalTime,
        },
        { status: 400 }
      );
    }

    // Handle general errors
    console.error('Error analyzing photo:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze photo',
        message: error instanceof Error ? error.message : 'Unknown error',
        totalTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Extract S3 key from S3 URL
 */
function extractS3KeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Handle both path-style and virtual-hosted-style URLs
    const pathname = urlObj.pathname;
    // Remove leading slash and bucket name if present
    return pathname.replace(/^\/[^/]+\//, '').replace(/^\//, '');
  } catch (error) {
    throw new Error(`Invalid S3 URL: ${url}`);
  }
}
