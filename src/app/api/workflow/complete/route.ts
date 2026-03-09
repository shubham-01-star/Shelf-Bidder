import { NextResponse } from 'next/server';
import { systemCoordinator } from '@/lib/integration/system-coordinator';
import { withApiLogging } from '@/lib/middleware/api-logger';
import { logger } from '@/lib/logger';

/**
 * Complete Workflow API
 * Task 15.1: End-to-end workflow orchestration
 */

async function handlePOST(request: Request) {
  try {
    const body = await request.json();
    const { photoUrl, shopkeeperId, phoneNumber, timezone, language } = body;

    // Validate required fields
    if (!photoUrl || !shopkeeperId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: photoUrl, shopkeeperId, phoneNumber' },
        { status: 400 }
      );
    }

    // Execute complete workflow
    const result = await systemCoordinator.completeDailyWorkflow(photoUrl, {
      shopkeeperId,
      phoneNumber,
      timezone: timezone || 'Asia/Kolkata',
      language: language || 'en',
    });

    logger.info('Workflow completed', {
      shopkeeperId,
      success: result.success,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Workflow execution failed', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Workflow execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = withApiLogging(handlePOST);
