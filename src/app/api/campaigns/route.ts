import { NextResponse } from 'next/server';
import { CampaignOperations } from '@/lib/db/postgres/operations/campaign';
import { withAuth } from '@/lib/middleware/auth';

import { logger } from '@/lib/logger';

/**
 * Campaign Management API
 * Task 5.2: Create VPS API endpoints for campaign management
 */

async function handleGET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const location = searchParams.get('location');

    const offset = (page - 1) * limit;

    // If location specified, find matching campaigns
    if (location) {
      const minBudget = parseFloat(searchParams.get('minBudget') || '0');
      const campaigns = await CampaignOperations.findMatchingCampaigns(
        location,
        minBudget,
        { limit }
      );
      return NextResponse.json({ campaigns, total: campaigns.length });
    }

    // Otherwise list all campaigns
    const result = await CampaignOperations.list({ limit, offset });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to fetch campaigns', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

async function handlePOST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = [
      'agent_id',
      'brand_name',
      'product_name',
      'product_category',
      'budget',
      'payout_per_task',
      'target_locations',
      'placement_requirements',
      'product_dimensions',
      'start_date',
      'end_date',
    ];

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create campaign
    const campaign = await CampaignOperations.create(body);

    logger.info('Campaign created', { campaignId: campaign.id });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    logger.error('Failed to create campaign', error);
    return NextResponse.json(
      { error: 'Failed to create campaign', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);
