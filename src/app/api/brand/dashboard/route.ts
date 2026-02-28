/**
 * Brand Dashboard API
 * GET /api/brand/dashboard — Spending summary, active bids, won auctions
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const brandId = request.headers.get('x-brand-id') || 'default';

  // Prototype: return mock dashboard data
  const dashboard = {
    brandId,
    totalSpent: 12450,
    activeBids: 3,
    auctionsWon: 28,
    auctionsLost: 15,
    auctionsParticipated: 43,
    monthlySpend: 4200,
    winRate: Math.round((28 / 43) * 100),
    recentBids: [
      { id: 'bid-1', auctionId: 'auc-101', productName: 'Pepsi 500ml', amount: 95, status: 'won', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'bid-2', auctionId: 'auc-102', productName: 'Lays Classic', amount: 75, status: 'pending', timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'bid-3', auctionId: 'auc-103', productName: 'Pepsi 500ml', amount: 120, status: 'lost', timestamp: new Date(Date.now() - 7200000).toISOString() },
    ],
  };

  return NextResponse.json({
    success: true,
    data: dashboard,
  });
}
