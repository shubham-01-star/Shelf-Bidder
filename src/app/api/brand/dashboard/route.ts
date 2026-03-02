/**
 * Brand Dashboard API
 * GET /api/brand/dashboard — Spending summary, active bids, won auctions
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const brandId = request.headers.get('x-brand-id') || 'default';
  
  // Since we use the same user pool, brandName is what identifies bids.
  // In a real multi-tenant architecture, this might be a dedicated ID.
  const brandNameObj = await getBrandNameFromRequest(request);
  const brandName = brandNameObj || 'PepsiCo'; // fallback for demo if needed

  try {
    const { AuctionOperations } = await import('@/lib/db');
    
    // Fetch recent active and completed auctions 
    const activeAuctionsRes = await AuctionOperations.queryByStatus('active', { limit: 50 });
    const completedAuctionsRes = await AuctionOperations.queryByStatus('completed', { limit: 100 });
    
    const allAuctions = [...(activeAuctionsRes.items || []), ...(completedAuctionsRes.items || [])];
    
    let totalSpent = 0;
    let activeBidsCount = 0;
    let auctionsWon = 0;
    let auctionsLost = 0;
    const recentBids: any[] = [];
    
    // Process all auctions to extract this brand's metrics
    for (const auction of allAuctions) {
      if (!auction.bids) continue;
      
      const brandBids = auction.bids.filter(b => b.productDetails.brand === brandName);
      if (brandBids.length === 0) continue;
      
      // Get the highest bid placed by this brand on this auction
      const maxBid = brandBids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
      
      if (auction.status === 'active') {
        activeBidsCount++;
        recentBids.push({
          id: maxBid.id,
          auctionId: auction.id,
          productName: maxBid.productDetails.name,
          amount: maxBid.amount,
          status: 'pending',
          timestamp: maxBid.timestamp
        });
      } else if (auction.status === 'completed') {
        const isWinner = auction.winnerId ? brandBids.some(b => b.agentId === auction.winnerId) : false;
        
        if (isWinner) {
          auctionsWon++;
          // For prototype, simply add winning bid to total spent
          totalSpent += auction.winningBid || maxBid.amount;
        } else {
          auctionsLost++;
        }
        
        recentBids.push({
          id: maxBid.id,
          auctionId: auction.id,
          productName: maxBid.productDetails.name,
          amount: maxBid.amount,
          status: isWinner ? 'won' : 'lost',
          timestamp: maxBid.timestamp
        });
      }
    }
    
    // Sort recent bids by newest first
    recentBids.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const auctionsParticipated = auctionsWon + auctionsLost + activeBidsCount;
    const winRate = auctionsParticipated > 0 ? Math.round((auctionsWon / (auctionsWon + auctionsLost)) * 100) : 0;

    const dashboard = {
      brandId,
      totalSpent,
      activeBids: activeBidsCount,
      auctionsWon,
      auctionsLost,
      auctionsParticipated,
      monthlySpend: totalSpent, // Simplified for prototype
      winRate,
      recentBids: recentBids.slice(0, 10), // Return top 10 recent
    };

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Failed to fetch brand dashboard data', error);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}

// Helper to grab brandname from header for db filtering
async function getBrandNameFromRequest(request: NextRequest) {
  // We can pass brandName explicitly or resolve from token. 
  // For prototype speed, we'll parse it from localstorage header if provided 
  // Alternatively we pass brandName as header in the ui page fetch request
  const headerBrandName = request.headers.get('x-brand-name');
  if (headerBrandName) return headerBrandName;
  
  // Alternatively, parse from token
  return null;
}
