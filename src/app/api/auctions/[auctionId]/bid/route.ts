/**
 * API Route: Submit Bid on Auction
 * POST /api/auctions/[auctionId]/bid
 *
 * Task 5.3: Brand Agent communication - bid submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitBid, BidValidationError } from '@/lib/auction';

interface RouteContext {
  params: Promise<{ auctionId: string }>;
}

/**
 * POST /api/auctions/:auctionId/bid
 *
 * Request body:
 * {
 *   agentId: string,
 *   amount: number,
 *   productDetails: {
 *     name: string,
 *     brand: string,
 *     category: string,
 *     dimensions: { width: number, height: number, depth?: number }
 *   }
 * }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { auctionId } = await context.params;
    const body = await request.json();
    const { agentId, amount, productDetails } = body;

    // Validate required fields
    if (!agentId || amount === undefined || !productDetails) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'agentId, amount, and productDetails are required',
        },
        { status: 400 }
      );
    }

    // Submit the bid
    const updatedAuction = await submitBid(
      auctionId,
      agentId,
      amount,
      productDetails
    );

    return NextResponse.json({
      success: true,
      data: {
        auctionId,
        bidCount: updatedAuction.bids.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof BidValidationError) {
      return NextResponse.json(
        {
          error: 'Bid rejected',
          code: error.code,
          message: error.message,
          details: error.details,
        },
        { status: 400 }
      );
    }

    console.error('Error submitting bid:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit bid',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
