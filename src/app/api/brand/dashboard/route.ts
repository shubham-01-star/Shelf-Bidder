import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

import { BrandOperations } from '@/lib/db/postgres/operations/brand';

export async function GET(request: NextRequest) {
  const brandId = request.headers.get('x-brand-id') || 'brand-demo-001';

  try {
    // 0. Get Brand Balance
    const brand = await BrandOperations.getById(brandId);
    const walletBalance = brand?.wallet_balance || 0;

    // 1. Get Active Campaigns & Remaining Budget
    const campaignsResult = await query(
      `SELECT COUNT(*) as active_count,
              COALESCE(SUM(remaining_budget), 0) as total_remaining,
              COALESCE(SUM(budget), 0) as total_budget
       FROM campaigns
       WHERE agent_id = $1 AND status = 'active'`,
       [brandId]
    );
    const activeCampaigns = parseInt(campaignsResult.rows[0].active_count || '0');
    const remainingBudget = parseFloat(campaignsResult.rows[0].total_remaining || '0');
    const totalBudget = parseFloat(campaignsResult.rows[0].total_budget || '0');

    // 2. Get Successful Placements (count of completed tasks for this brand's campaigns)
    // For demo, we use a simple count of payout transactions
    const placementsResult = await query(
      `SELECT COUNT(*) as placement_count
       FROM wallet_transactions
       WHERE type = 'payout'`,
       []
    );
    const successfulPlacements = parseInt(placementsResult.rows[0]?.placement_count || '0');
    
    // For the demo presentation, fetch campaigns as recent activity
    const recentTasksResult = await query(
      `SELECT id, product_name, brand_name, payout_per_task as payout_amount, created_at, 
              'https://staging-shelf-bidder-photos-338261675242.s3.amazonaws.com/demo/coke-after.png' as proof_url 
       FROM campaigns 
       WHERE agent_id = $1 
       ORDER BY created_at DESC LIMIT 5`,
       [brandId]
    );

    const dashboard = {
      brandId,
      walletBalance,
      activeCampaigns,
      remainingBudget,
      totalSpent: totalBudget - remainingBudget, // actual spent
      successfulPlacements,
      recentActivity: recentTasksResult.rows,
    };

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    console.error('Failed to fetch brand dashboard data', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
