import { NextResponse } from 'next/server';
import { CampaignOperations } from '@/lib/db/postgres/operations/campaign';
import { withAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

/**
 * Campaign Detail API
 * Task 5.2: Campaign management endpoints
 */

async function handleGET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await CampaignOperations.getById(params.id);
    return NextResponse.json(campaign);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    logger.error('Failed to fetch campaign', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

async function handlePATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Missing required field: status' },
        { status: 400 }
      );
    }

    const validStatuses = ['active', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const campaign = await CampaignOperations.updateStatus(params.id, status);

    logger.info('Campaign status updated', {
      campaignId: params.id,
      status,
    });

    return NextResponse.json(campaign);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    logger.error('Failed to update campaign', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

async function handleDELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await CampaignOperations.delete(params.id);

    logger.info('Campaign deleted', { campaignId: params.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    logger.error('Failed to delete campaign', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const PATCH = withAuth(handlePATCH);
export const DELETE = withAuth(handleDELETE);
