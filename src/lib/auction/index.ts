/**
 * Auction Module Exports
 *
 * Task 5.1: Auction Engine
 */

export {
  initializeAuctions,
  submitBid,
  selectWinner,
  cancelAuction,
  getActiveAuctions,
  getAuctionsByShelfSpace,
} from './auction-engine';

export {
  validateBid,
  validateProductFit,
  BidValidationError,
  type BidValidationResult,
} from './bid-validator';
