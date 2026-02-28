/**
 * API Route: Verify Task Completion
 * POST /api/tasks/verify
 * 
 * Verifies task completion using Claude 3.5 Vision to compare before/after photos
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyTaskCompletion, verifyProofPhoto, VerificationError } from '@/lib/vision';
import { getObject } from '@/lib/storage';
import { PlacementInstructions } from '@/types/models';

/**
 * Request body interface
 */
interface VerifyTaskRequest {
  taskId: string;
  shopkeeperId: string;
  beforePhotoUrl?: string;
  beforePhotoData?: string; // Base64 encoded
  afterPhotoUrl?: string;
  afterPhotoData?: string; // Base64 encoded
  instructions: PlacementInstructions;
  mimeType?: string;
}

/**
 * POST handler for verifying task completion
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: VerifyTaskRequest = await request.json();
    const {
      taskId,
      shopkeeperId,
      beforePhotoUrl,
      beforePhotoData,
      afterPhotoUrl,
      afterPhotoData,
      instructions,
      mimeType = 'image/jpeg',
    } = body;

    // Validate required fields
    if (!taskId || !shopkeeperId || !instructions) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'taskId, shopkeeperId, and instructions are required',
        },
        { status: 400 }
      );
    }

    if (!afterPhotoUrl && !afterPhotoData) {
      return NextResponse.json(
        {
          error: 'After photo is required',
          details: 'Either afterPhotoUrl or afterPhotoData must be provided',
        },
        { status: 400 }
      );
    }

    // Get after image buffer
    const afterBuffer = await getImageBuffer(
      afterPhotoUrl,
      afterPhotoData,
      'after photo'
    );

    // Determine verification method
    let result;

    if (beforePhotoUrl || beforePhotoData) {
      // Full verification with before/after comparison
      const beforeBuffer = await getImageBuffer(
        beforePhotoUrl,
        beforePhotoData,
        'before photo'
      );

      result = await verifyTaskCompletion(
        beforeBuffer,
        mimeType,
        afterBuffer,
        mimeType,
        instructions
      );
    } else {
      // Simplified verification (proof photo only)
      result = await verifyProofPhoto(afterBuffer, mimeType, instructions);
    }

    const totalTime = Date.now() - startTime;

    // Check if verification meets performance requirement (30 seconds)
    if (totalTime > 30000) {
      console.warn(
        `Verification took ${totalTime}ms, exceeding 30s requirement (Requirement 5.3)`
      );
    }

    // Return verification results
    return NextResponse.json({
      success: true,
      data: {
        taskId,
        shopkeeperId,
        verified: result.verified,
        feedback: result.feedback,
        confidence: result.confidence,
        totalTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;

    // Handle specific verification errors
    if (error instanceof VerificationError) {
      console.error('Verification error:', error.code, error.details);
      return NextResponse.json(
        {
          error: 'Verification failed',
          code: error.code,
          message: error.message,
          details: error.details,
          totalTime,
        },
        { status: 400 }
      );
    }

    // Handle general errors
    console.error('Error verifying task:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify task',
        message: error instanceof Error ? error.message : 'Unknown error',
        totalTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Get image buffer from URL or base64 data
 */
async function getImageBuffer(
  url: string | undefined,
  data: string | undefined,
  label: string
): Promise<Buffer> {
  if (data) {
    // Use provided base64 image data
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }

  if (url) {
    // Download from S3
    const key = extractS3KeyFromUrl(url);
    return await getObject(key);
  }

  throw new Error(`No ${label} provided`);
}

/**
 * Extract S3 key from S3 URL
 */
function extractS3KeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.replace(/^\/[^/]+\//, '').replace(/^\//, '');
  } catch (error) {
    throw new Error(`Invalid S3 URL: ${url}`);
  }
}
