/**
 * Bid Validation Logic
 * 
 * Task 5.1: Auction Engine - Bid collection and validation
 * Validates bids against auction rules and shelf space constraints
 */

import { Auction, Bid, EmptySpace, ProductDetails } from '@/types/models';

/**
 * Validation error with specific code for programmatic handling
 */
export class BidValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BidValidationError';
  }
}

/**
 * Result of bid validation
 */
export interface BidValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a bid against auction rules and shelf space constraints
 * 
 * Validation checks:
 * 1. Auction is active
 * 2. Auction hasn't expired
 * 3. Bid amount is positive
 * 4. Product dimensions fit the empty space
 * 5. Agent hasn't already bid on this auction
 */
export function validateBid(
  bid: Pick<Bid, 'agentId' | 'amount' | 'productDetails'>,
  auction: Auction,
  emptySpace: EmptySpace
): BidValidationResult {
  const errors: string[] = [];

  // 1. Check auction is active
  if (auction.status !== 'active') {
    errors.push(`Auction is not active (current status: ${auction.status})`);
  }

  // 2. Check auction hasn't expired
  const now = new Date();
  const endTime = new Date(auction.endTime);
  if (now > endTime) {
    errors.push(`Auction has expired (ended at ${auction.endTime})`);
  }

  // 3. Check bid amount is positive
  if (bid.amount <= 0) {
    errors.push(`Bid amount must be positive (got: ${bid.amount})`);
  }

  // 4. Check product dimensions fit the empty space
  if (bid.productDetails?.dimensions) {
    const dimensionErrors = validateProductFit(
      bid.productDetails,
      emptySpace
    );
    errors.push(...dimensionErrors);
  }

  // 5. Check agent hasn't already bid
  const existingBid = auction.bids.find(
    (b) => b.agentId === bid.agentId && b.status === 'valid'
  );
  if (existingBid) {
    errors.push(
      `Agent ${bid.agentId} has already placed a valid bid on this auction`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that a product's dimensions fit within the empty shelf space
 * Uses the pixel coordinates of the empty space as a proxy for physical dimensions
 */
export function validateProductFit(
  product: ProductDetails,
  space: EmptySpace
): string[] {
  const errors: string[] = [];
  const { dimensions } = product;

  if (!dimensions) return errors;

  // Compare product dimensions against space dimensions
  // Space coordinates are in pixels; we use width/height proportionally
  if (dimensions.width > space.coordinates.width) {
    errors.push(
      `Product width (${dimensions.width}) exceeds space width (${space.coordinates.width})`
    );
  }

  if (dimensions.height > space.coordinates.height) {
    errors.push(
      `Product height (${dimensions.height}) exceeds space height (${space.coordinates.height})`
    );
  }

  return errors;
}
