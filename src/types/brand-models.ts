/**
 * Brand Owner Data Models
 * Types for the Brand Owner portal
 */

export interface BrandOwner {
  id: string;
  brandName: string;
  email: string;
  contactPerson: string;
  category: string;
  totalSpent: number;
  auctionsWon: number;
  auctionsParticipated: number;
  createdAt: string;
}

export interface BrandProduct {
  id: string;
  brandOwnerId: string;
  name: string;
  brand: string;
  category: string;
  dimensions: {
    width: number;
    height: number;
    depth?: number;
  };
  weight?: number;
  imageUrl?: string;
  createdAt: string;
}

export interface BrandBid {
  id: string;
  auctionId: string;
  productId: string;
  productName: string;
  amount: number;
  status: 'pending' | 'won' | 'lost' | 'rejected';
  timestamp: string;
}

export interface BrandDashboardData {
  totalSpent: number;
  activeBids: number;
  auctionsWon: number;
  auctionsLost: number;
  recentBids: BrandBid[];
  monthlySpend: number;
}
