/**
 * Core data models for Shelf-Bidder system
 * These interfaces define the structure of all entities in the application
 */

// ============================================================================
// Shopkeeper
// ============================================================================

export interface Shopkeeper {
  id: string;
  name: string;
  phoneNumber: string;
  storeAddress: string;
  preferredLanguage: string;
  timezone: string;
  walletBalance: number;
  registrationDate: string;
  lastActiveDate: string;
}

// ============================================================================
// Shelf Space
// ============================================================================

export type Visibility = 'high' | 'medium' | 'low';
export type Accessibility = 'easy' | 'moderate' | 'difficult';

export interface EmptySpace {
  id: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  shelfLevel: number;
  visibility: Visibility;
  accessibility: Accessibility;
}

export interface Product {
  name: string;
  brand: string;
  category: string;
}

export interface ShelfSpace {
  id: string;
  shopkeeperId: string;
  photoUrl: string;
  analysisDate: string;
  emptySpaces: EmptySpace[];
  currentInventory: Product[];
  analysisConfidence: number;
}

// ============================================================================
// Auction
// ============================================================================

export type AuctionStatus = 'active' | 'completed' | 'cancelled';
export type BidStatus = 'valid' | 'invalid' | 'withdrawn';

export interface Dimensions {
  width: number;
  height: number;
  depth?: number;
}

export interface ProductDetails {
  name: string;
  brand: string;
  category: string;
  dimensions: Dimensions;
}

export interface Bid {
  id: string;
  agentId: string;
  amount: number;
  productDetails: ProductDetails;
  timestamp: string;
  status: BidStatus;
}

export interface Auction {
  id: string;
  shelfSpaceId: string;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  bids: Bid[];
  winnerId?: string;
  winningBid?: number;
}

// ============================================================================
// Task
// ============================================================================

export type TaskStatus = 'assigned' | 'in_progress' | 'completed' | 'failed';

export interface PlacementInstructions {
  productName: string;
  brandName: string;
  targetLocation: EmptySpace;
  positioningRules: string[];
  visualRequirements: string[];
  timeLimit: number; // hours
}

export interface VerificationResult {
  verified: boolean;
  feedback: string;
  confidence: number;
}

export interface Task {
  id: string;
  auctionId: string;
  shopkeeperId: string;
  instructions: PlacementInstructions;
  status: TaskStatus;
  assignedDate: string;
  completedDate?: string;
  proofPhotoUrl?: string;
  earnings: number;
  verificationResult?: VerificationResult;
}

// ============================================================================
// Wallet Transaction
// ============================================================================

export type TransactionType = 'earning' | 'payout' | 'adjustment';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface WalletTransaction {
  id: string;
  shopkeeperId: string;
  type: TransactionType;
  amount: number;
  description: string;
  taskId?: string;
  timestamp: string;
  status: TransactionStatus;
}
