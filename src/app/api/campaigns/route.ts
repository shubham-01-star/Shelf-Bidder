import { NextResponse } from 'next/server';
import { CampaignOperations } from '@/lib/db/postgres/operations/campaign';
import { BrandOperations } from '@/lib/db/postgres/operations/brand';
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

    // Validate required fields for the Demo
    const required = [
      'productName',
      'category',
      'totalBudget',
      'rewardPerPlacement'
    ];

    for (const field of required) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const brandId = body.brandId || 'brand-demo-001';
    
    // Check and deduct from brand wallet balance
    const brand = await BrandOperations.getById(brandId);
    if (!brand || brand.wallet_balance < body.totalBudget) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance', message: `Please recharge your wallet. Current balance: ₹${brand?.wallet_balance || 0}` },
        { status: 402 }
      );
    }

    // Default dates for the demo campaign
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create campaign using Hackathon simplified input mapped to DB schema
    // Note: Deducting from brand wallet
    await BrandOperations.rechargeWallet(brandId, -body.totalBudget);

    const campaign = await CampaignOperations.create({
      agent_id: brandId,
      brand_id: brandId,
      brand_name: body.brandName || brand.name || 'Demo Brand',
      product_name: body.productName,
      product_category: body.category,
      budget: body.totalBudget,
      payout_per_task: body.rewardPerPlacement,
      target_locations: ['New Delhi', 'Mumbai', 'Bangalore'], // Global demo locations
      placement_requirements: [{ type: 'position', description: 'Eye level preferred', required: true }],
      product_dimensions: { width: 10, height: 20, depth: 10, unit: 'cm' },
      start_date: startDate,
      end_date: endDate,
    });

    logger.info('Campaign created for Hackathon Demo', { campaignId: campaign.id });

    return NextResponse.json({ success: true, data: campaign }, { status: 201 });
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
