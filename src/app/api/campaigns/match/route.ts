import { NextResponse } from 'next/server';
import { campaignMatcher } from '@/lib/services/campaign-matcher';
import { withAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

/**
 * Campaign Matching API
 * Task 5.1: Implement campaign matching system
 * 
 * Automatically matches campaigns with shelf spaces based on budget and location
 */

async function handlePOST(request: Request) {
  try {
    const body = await request.json();
    const { shopkeeperId, shelfSpaceId, location, emptySpaces } = body;

    // Validate required fields
    if (!shopkeeperId || !shelfSpaceId || !location || !emptySpaces) {
      return NextResponse.json(
        {
          error: 'Missing required fields: shopkeeperId, shelfSpaceId, location, emptySpaces',
        },
        { status: 400 }
      );
    }

    // Match campaign
    const result = await campaignMatcher.matchCampaign(
      shopkeeperId,
      shelfSpaceId,
      location,
      emptySpaces
    );

    if (!result.matched) {
      return NextResponse.json(
        {
          matched: false,
          message: result.reason || 'No matching campaigns found',
        },
        { status: 200 }
      );
    }

    logger.info('Campaign matched', {
      shopkeeperId,
      campaignId: result.campaign?.id,
      taskId: result.taskId,
    });

    return NextResponse.json({
      matched: true,
      campaign: {
        id: result.campaign?.id,
        brandName: result.campaign?.brandName,
        productName: result.campaign?.productName,
        earnings: result.earnings,
      },
      taskId: result.taskId,
      message: 'Campaign matched successfully! Check your tasks to get started.',
    });
  } catch (error) {
    logger.error('Campaign matching failed', error);
    return NextResponse.json(
      {
        error: 'Campaign matching failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);
