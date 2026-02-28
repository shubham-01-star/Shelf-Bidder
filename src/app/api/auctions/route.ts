/**
 * API Route: Auctions
 * GET  /api/auctions - List active auctions
 * POST /api/auctions - Initialize new auctions from shelf analysis
 *
 * Task 5.3: Brand Agent communication system
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeAuctions, getActiveAuctions } from '@/lib/auction';
import { ShelfSpaceOperations } from '@/lib/db';

/**
 * GET /api/auctions
 * Returns all active auctions for brand agents to discover
 */
export async function GET() {
  try {
    const auctions = await getActiveAuctions();

    return NextResponse.json({
      success: true,
      data: {
        auctions,
        count: auctions.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching active auctions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch auctions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auctions
 * Initialize new auctions from shelf space analysis results
 *
 * Request body:
 * {
 *   shelfSpaceId: string,
 *   durationMinutes?: number (default: 15)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shelfSpaceId, durationMinutes } = body;

    if (!shelfSpaceId) {
      return NextResponse.json(
        { error: 'shelfSpaceId is required' },
        { status: 400 }
      );
    }

    // Fetch the shelf space to get empty spaces
    const shelfSpace = await ShelfSpaceOperations.get(shelfSpaceId);

    if (!shelfSpace.emptySpaces || shelfSpace.emptySpaces.length === 0) {
      return NextResponse.json(
        {
          error: 'No empty spaces found',
          message: 'The shelf space analysis did not detect any empty spaces to auction',
        },
        { status: 400 }
      );
    }

    // Initialize auctions for each empty space
    const auctions = await initializeAuctions(
      shelfSpaceId,
      shelfSpace.emptySpaces,
      durationMinutes
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          auctions,
          count: auctions.length,
          shelfSpaceId,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error initializing auctions:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize auctions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
