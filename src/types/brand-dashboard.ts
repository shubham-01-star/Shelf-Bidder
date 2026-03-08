/**
 * TypeScript interfaces for Brand Dashboard Redesign
 * Feature: brand-dashboard-redesign
 */

// Authentication System
export interface BrandCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  brandId: string;
  brandToken: string;
  brandName: string;
  error?: string;
}

// Wallet System
export interface WalletData {
  balance: number;
  escrowedFunds: number;
  totalSpent: number;
}

export interface RechargeRequest {
  brandId: string;
  amount: number;
  paymentMethod: 'card' | 'upi' | 'netbanking';
}

export interface Transaction {
  transactionId: string;
  type: 'recharge' | 'spend' | 'escrow' | 'release';
  amount: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  metadata?: {
    campaignId?: string;
    auctionId?: string;
    orderId?: string;
    paymentMethod?: string;
  };
}

// Metrics Cards
export interface DashboardMetrics {
  activeCampaigns: number;
  totalSpent: number;
  auctionsWon: number;
  walletBalance: number;
  escrowedFunds?: number;
}

// Product Catalog
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  imageUrl?: string;
}

// Campaign Manager
export interface CampaignForm {
  productName: string;
  category: string;
  totalBudget: number;
  rewardPerPlacement: number;
  targetProducts?: string[];
}

export interface CampaignResponse {
  success: boolean;
  campaignId?: string;
  error?: string;
}

// Live Auctions
export interface Auction {
  id: string;
  shelfLocation: string;
  shopkeeperArea: string;
  spaceSize: string;
  shelfLevel: number;
  visibility: 'High' | 'Medium' | 'Low';
  currentBids: number;
  highestBid: number;
  basePrice: number;
  endsIn: string;
  status: 'active' | 'closed' | 'won';
}

export interface BidRequest {
  auctionId: string;
  amount: number;
  productName: string;
  brandName: string;
}

// Proof Gallery
export interface ProofPhoto {
  id: string;
  photoUrl: string; // S3 URL
  productName: string;
  brandName: string;
  timestamp: string;
  payoutAmount: number;
  verified: boolean;
  verificationMethod: 'Amazon Bedrock' | 'Manual';
}

// Data Models
export interface Brand {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  agentId: string; // Brand ID
  productName: string;
  brandName: string;
  category: string;
  budget: number;
  remainingBudget: number;
  payoutPerTask: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  brandId: string;
  type: 'recharge' | 'spend' | 'escrow' | 'release';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'completed' | 'pending' | 'failed';
  metadata?: {
    campaignId?: string;
    auctionId?: string;
    orderId?: string;
    paymentMethod?: string;
  };
  createdAt: string;
}

export interface Task {
  id: string;
  campaignId: string;
  shopkeeperId: string;
  productName: string;
  brandName: string;
  proofUrl: string; // S3 URL
  payoutAmount: number;
  status: 'completed' | 'verified' | 'paid';
  verifiedAt: string;
  createdAt: string;
}
