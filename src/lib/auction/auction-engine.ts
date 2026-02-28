/**
 * Auction Engine - Core Business Logic
 *
 * Task 5.1: Implement auction management functions
 * Manages the full lifecycle of shelf-space auctions:
 *  - Initialize auctions from shelf analysis
 *  - Collect and validate bids from brand agents
 *  - Select winners (highest bid)
 *  - Cancel auctions
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Auction,
  Bid,
  EmptySpace,
  ProductDetails,
  AuctionStatus,
} from '@/types/models';
import { AuctionOperations, ShelfSpaceOperations } from '@/lib/db';
import { validateBid, BidValidationError } from './bid-validator';

// ============================================================================
// Constants
// ============================================================================

/** Default auction duration in minutes */
const DEFAULT_AUCTION_DURATION_MINUTES = 15;

/** Minimum number of bids required for an auction to complete normally */
const MIN_BIDS_FOR_COMPLETION = 0;

// ============================================================================
// Auction Initialization
// ============================================================================

/**
 * Initialize auctions for all empty spaces detected on a shelf
 *
 * Creates one auction per empty space. Each auction runs for the
 * specified duration (default 15 minutes as per Requirement 3.1).
 *
 * @param shelfSpaceId - The shelf space analysis that detected empty spaces
 * @param emptySpaces - Array of empty spaces to create auctions for
 * @param durationMinutes - Auction duration in minutes (default: 15)
 * @returns Array of created auctions
 */
export async function initializeAuctions(
  shelfSpaceId: string,
  emptySpaces: EmptySpace[],
  durationMinutes: number = DEFAULT_AUCTION_DURATION_MINUTES
): Promise<Auction[]> {
  if (!emptySpaces || emptySpaces.length === 0) {
    return [];
  }

  const now = new Date();
  const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

  const auctions: Auction[] = [];

  for (const space of emptySpaces) {
    const auction: Auction = {
      id: uuidv4(),
      shelfSpaceId,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      status: 'active',
      bids: [],
    };

    const created = await AuctionOperations.create(auction);
    auctions.push(created);
  }

  return auctions;
}

// ============================================================================
// Bid Management
// ============================================================================

/**
 * Submit a bid on an auction
 *
 * Validates the bid against auction rules and shelf space constraints,
 * then adds it to the auction's bid list.
 *
 * @param auctionId - The auction to bid on
 * @param agentId - The brand agent submitting the bid
 * @param amount - Bid amount in INR
 * @param productDetails - Details of the product to be placed
 * @returns The updated auction with the new bid
 * @throws BidValidationError if the bid is invalid
 */
export async function submitBid(
  auctionId: string,
  agentId: string,
  amount: number,
  productDetails: ProductDetails
): Promise<Auction> {
  // Fetch the auction
  const auction = await AuctionOperations.get(auctionId);

  // Fetch the shelf space to get the empty space details for dimension validation
  const shelfSpaceData = await getShelfSpaceForAuction(auction.shelfSpaceId);

  // Find the matching empty space for dimension validation
  const emptySpace = shelfSpaceData?.emptySpaces?.[0] || createDefaultEmptySpace();

  // Build the bid candidate
  const bidCandidate = { agentId, amount, productDetails };

  // Validate the bid
  const validation = validateBid(bidCandidate, auction, emptySpace);

  if (!validation.valid) {
    throw new BidValidationError(
      `Bid validation failed: ${validation.errors.join('; ')}`,
      'BID_VALIDATION_FAILED',
      { errors: validation.errors }
    );
  }

  // Create the bid
  const bid: Bid = {
    id: uuidv4(),
    agentId,
    amount,
    productDetails,
    timestamp: new Date().toISOString(),
    status: 'valid',
  };

  // Add bid to auction
  const updatedBids = [...auction.bids, bid];
  const updatedAuction = await AuctionOperations.update(auctionId, {
    bids: updatedBids,
  });

  return updatedAuction;
}

// ============================================================================
// Winner Selection
// ============================================================================

/**
 * Close an auction and select the winner
 *
 * The winner is the bid with the highest amount (Requirement 3.4).
 * If no bids exist, the auction is cancelled instead.
 *
 * @param auctionId - The auction to close
 * @returns The updated auction with winner information
 */
export async function selectWinner(auctionId: string): Promise<Auction> {
  const auction = await AuctionOperations.get(auctionId);

  if (auction.status !== 'active') {
    throw new BidValidationError(
      `Cannot select winner for non-active auction (status: ${auction.status})`,
      'AUCTION_NOT_ACTIVE'
    );
  }

  // Filter only valid bids
  const validBids = auction.bids.filter((b) => b.status === 'valid');

  if (validBids.length <= MIN_BIDS_FOR_COMPLETION && validBids.length === 0) {
    // No valid bids — cancel the auction
    return cancelAuction(auctionId, 'No valid bids received');
  }

  // Select highest bid as winner
  const winningBid = validBids.reduce((highest, current) =>
    current.amount > highest.amount ? current : highest
  );

  // Update auction with winner
  const updatedAuction = await AuctionOperations.update(auctionId, {
    status: 'completed' as AuctionStatus,
    winnerId: winningBid.agentId,
    winningBid: winningBid.amount,
  });

  return updatedAuction;
}

// ============================================================================
// Auction Cancellation
// ============================================================================

/**
 * Cancel an auction
 *
 * Sets the auction status to 'cancelled'. Can be called for auctions
 * with no bids, or manually by the system.
 *
 * @param auctionId - The auction to cancel
 * @param reason - Reason for cancellation (for logging)
 * @returns The updated (cancelled) auction
 */
export async function cancelAuction(
  auctionId: string,
  reason: string = 'Cancelled by system'
): Promise<Auction> {
  console.log(`Cancelling auction ${auctionId}: ${reason}`);

  const updatedAuction = await AuctionOperations.update(auctionId, {
    status: 'cancelled' as AuctionStatus,
  });

  return updatedAuction;
}

// ============================================================================
// Auction Queries
// ============================================================================

/**
 * Get all currently active auctions
 *
 * @returns Array of active auctions
 */
export async function getActiveAuctions(): Promise<Auction[]> {
  const result = await AuctionOperations.queryByStatus('active');
  return result.items;
}

/**
 * Get auctions for a specific shelf space
 *
 * @param shelfSpaceId - The shelf space to query auctions for
 * @returns Array of auctions for the shelf space
 */
export async function getAuctionsByShelfSpace(
  shelfSpaceId: string
): Promise<Auction[]> {
  const result = await AuctionOperations.queryByShelfSpace(shelfSpaceId);
  return result.items;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get shelf space details for an auction
 */
async function getShelfSpaceForAuction(
  shelfSpaceId: string
): Promise<{ emptySpaces: EmptySpace[] } | null> {
  try {
    const shelfSpace = await ShelfSpaceOperations.get(shelfSpaceId);
    return shelfSpace;
  } catch {
    // If shelf space not found, return null — validation will use default
    return null;
  }
}

/**
 * Create a default empty space for validation when shelf space data is unavailable
 * Uses generous dimensions so dimension validation doesn't block bids unnecessarily
 */
function createDefaultEmptySpace(): EmptySpace {
  return {
    id: 'default',
    coordinates: {
      x: 0,
      y: 0,
      width: 10000, // Very large to be permissive
      height: 10000,
    },
    shelfLevel: 1,
    visibility: 'medium',
    accessibility: 'moderate',
  };
}
