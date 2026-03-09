/**
 * API Route: Close Auction and Select Winner
 * POST /api/auctions/[auctionId]/close
 *
 * Task 5.3: Brand Agent communication - auction result broadcasting
 */

import { NextRequest, NextResponse } from 'next/server';
import { selectWinner, BidValidationError } from '@/lib/auction';

interface RouteContext {
  params: Promise<{ auctionId: string }>;
}

/**
 * POST /api/auctions/:auctionId/close
 *
 * Closes the auction and selects the highest bidder as winner.
 * If no bids are received, the auction is cancelled.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { auctionId } = await context.params;

    const updatedAuction = await selectWinner(auctionId);

    return NextResponse.json({
      success: true,
      data: {
        auctionId,
        status: updatedAuction.status,
        winnerId: updatedAuction.winnerId || null,
        winningBid: updatedAuction.winningBid || null,
        totalBids: updatedAuction.bids.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof BidValidationError) {
      return NextResponse.json(
        {
          error: 'Cannot close auction',
          code: error.code,
          message: error.message,
        },
        { status: 400 }
      );
    }

    console.error('Error closing auction:', error);
    return NextResponse.json(
      {
        error: 'Failed to close auction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
