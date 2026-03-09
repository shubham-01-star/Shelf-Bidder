/**
 * Brand Dashboard API Client Utility Functions
 * Feature: brand-dashboard-redesign
 * Task 2.3: Create API client utility functions
 * 
 * Provides type-safe API client functions for brand dashboard operations
 * with comprehensive error handling and logging.
 */

import { apiClient, ApiError } from '../api-client';
import { logger } from '../logger';
import type {
  DashboardMetrics,
  Product,
  Auction,
  Transaction,
  RechargeRequest,
  BidRequest,
} from '@/types/brand-dashboard';

/**
 * API Response wrapper type
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Dashboard metrics response from API
 */
interface DashboardApiResponse {
  brandId: string;
  walletBalance: number;
  activeCampaigns: number;
  remainingBudget: number;
  totalSpent: number;
  successfulPlacements: number;
  recentActivity: unknown[];
}

/**
 * Products API response
 */
interface ProductsApiResponse {
  products: Product[];
  count: number;
}

/**
 * Recharge transaction response
 */
interface RechargeResponse {
  transactionId: string;
  orderId: string;
  brandId: string;
  amount: number;
  newBalance: number;
  status: string;
  paymentMethod: string;
  message: string;
  timestamp: string;
  gateway?: {
    provider: string;
    paymentId: string;
    signature: string;
  };
}

/**
 * Transaction history response
 */
interface TransactionHistoryResponse {
  brandId: string;
  transactions: Transaction[];
  totalRecharges: number;
  totalAmount: number;
}

/**
 * Bid response
 */
interface BidResponse {
  id: string;
  agentId: string;
  amount: number;
  productDetails: {
    name: string;
    brand: string;
    category: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
  timestamp: string;
  status: string;
}

/**
 * Fetch dashboard metrics including active campaigns, total spent, auctions won, and wallet balance
 * 
 * @returns Promise<DashboardMetrics> Dashboard metrics data
 * @throws ApiError if the request fails
 * 
 * **Validates: Requirements 6.2**
 */
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const startTime = Date.now();
  
  try {
    logger.info('Fetching dashboard metrics', { endpoint: '/api/brand/dashboard' });
    
    const response = await apiClient.get<ApiResponse<DashboardApiResponse>>(
      '/api/brand/dashboard'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch dashboard metrics');
    }

    const duration = Date.now() - startTime;
    logger.apiRequest('GET', '/api/brand/dashboard', 200, duration);

    // Transform API response to DashboardMetrics interface
    const metrics: DashboardMetrics = {
      activeCampaigns: response.data.activeCampaigns,
      totalSpent: response.data.totalSpent,
      auctionsWon: 0, // Not provided by current API, using placeholder
      walletBalance: response.data.walletBalance,
    };

    return metrics;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof ApiError) {
      logger.error('Dashboard metrics API error', error, {
        endpoint: '/api/brand/dashboard',
        status: error.status,
        duration,
      });
      throw error;
    }

    logger.error('Failed to fetch dashboard metrics', error, {
      endpoint: '/api/brand/dashboard',
      duration,
    });
    throw new ApiError(500, 'Failed to fetch dashboard metrics');
  }
}

/**
 * Fetch brand products from the catalog
 * 
 * @returns Promise<Product[]> Array of brand products
 * @throws ApiError if the request fails
 * 
 * **Validates: Requirements 8.1**
 */
export async function fetchProducts(): Promise<Product[]> {
  const startTime = Date.now();
  
  try {
    logger.info('Fetching brand products', { endpoint: '/api/brand/products' });
    
    const response = await apiClient.get<ApiResponse<ProductsApiResponse>>(
      '/api/brand/products'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch products');
    }

    const duration = Date.now() - startTime;
    logger.apiRequest('GET', '/api/brand/products', 200, duration);

    return response.data.products;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof ApiError) {
      logger.error('Products API error', error, {
        endpoint: '/api/brand/products',
        status: error.status,
        duration,
      });
      throw error;
    }

    logger.error('Failed to fetch products', error, {
      endpoint: '/api/brand/products',
      duration,
    });
    throw new ApiError(500, 'Failed to fetch products');
  }
}

/**
 * Fetch active auctions for shelf spaces
 * 
 * @returns Promise<Auction[]> Array of active auctions
 * @throws ApiError if the request fails
 * 
 * **Validates: Requirements 10.1**
 */
export async function fetchAuctions(): Promise<Auction[]> {
  const startTime = Date.now();
  
  try {
    logger.info('Fetching active auctions', { endpoint: '/api/brand/auctions' });
    
    const response = await apiClient.get<ApiResponse<Auction[]>>(
      '/api/brand/auctions'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch auctions');
    }

    const duration = Date.now() - startTime;
    logger.apiRequest('GET', '/api/brand/auctions', 200, duration);

    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof ApiError) {
      logger.error('Auctions API error', error, {
        endpoint: '/api/brand/auctions',
        status: error.status,
        duration,
      });
      throw error;
    }

    logger.error('Failed to fetch auctions', error, {
      endpoint: '/api/brand/auctions',
      duration,
    });
    throw new ApiError(500, 'Failed to fetch auctions');
  }
}

/**
 * Fetch wallet transaction history
 * 
 * @param brandId - The brand ID to fetch transactions for
 * @returns Promise<Transaction[]> Array of wallet transactions
 * @throws ApiError if the request fails
 * 
 * **Validates: Requirements 11.1**
 */
export async function fetchTransactions(brandId: string): Promise<Transaction[]> {
  const startTime = Date.now();
  
  try {
    logger.info('Fetching wallet transactions', {
      endpoint: '/api/brand/wallet/recharge',
      brandId,
    });
    
    const response = await apiClient.get<ApiResponse<TransactionHistoryResponse>>(
      `/api/brand/wallet/recharge?brandId=${encodeURIComponent(brandId)}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch transactions');
    }

    const duration = Date.now() - startTime;
    logger.apiRequest('GET', '/api/brand/wallet/recharge', 200, duration, { brandId });

    // Transform API response to Transaction interface
    const transactions: Transaction[] = response.data.transactions.map((tx) => ({
      transactionId: tx.transactionId,
      type: 'recharge', // API only returns recharge transactions
      amount: tx.amount,
      timestamp: tx.timestamp,
      status: tx.status as 'completed' | 'pending' | 'failed',
    }));

    return transactions;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof ApiError) {
      logger.error('Transactions API error', error, {
        endpoint: '/api/brand/wallet/recharge',
        status: error.status,
        brandId,
        duration,
      });
      throw error;
    }

    logger.error('Failed to fetch transactions', error, {
      endpoint: '/api/brand/wallet/recharge',
      brandId,
      duration,
    });
    throw new ApiError(500, 'Failed to fetch transactions');
  }
}

/**
 * Submit a wallet recharge request
 * 
 * @param request - Recharge request details (brandId, amount, paymentMethod)
 * @returns Promise<RechargeResponse> Recharge transaction details
 * @throws ApiError if the request fails or validation errors occur
 * 
 * **Validates: Requirements 10.5, 11.8**
 */
export async function submitRecharge(request: RechargeRequest): Promise<RechargeResponse> {
  const startTime = Date.now();
  
  try {
    // Validate minimum recharge amount
    const MIN_RECHARGE = 1000;
    if (request.amount < MIN_RECHARGE) {
      throw new ApiError(
        400,
        `Minimum recharge amount is ₹${MIN_RECHARGE}`,
        { minAmount: MIN_RECHARGE, providedAmount: request.amount }
      );
    }

    logger.info('Submitting wallet recharge', {
      endpoint: '/api/brand/wallet/recharge',
      brandId: request.brandId,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
    });
    
    const response = await apiClient.post<ApiResponse<RechargeResponse>>(
      '/api/brand/wallet/recharge',
      {
        brandId: request.brandId,
        amount: request.amount,
        paymentMethod: request.paymentMethod,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to process recharge');
    }

    const duration = Date.now() - startTime;
    logger.apiRequest('POST', '/api/brand/wallet/recharge', 200, duration, {
      brandId: request.brandId,
      amount: request.amount,
    });

    logger.walletTransaction(
      request.brandId,
      request.amount,
      'recharge',
      {
        transactionId: response.data.transactionId,
        newBalance: response.data.newBalance,
      }
    );

    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof ApiError) {
      logger.error('Recharge API error', error, {
        endpoint: '/api/brand/wallet/recharge',
        status: error.status,
        brandId: request.brandId,
        amount: request.amount,
        duration,
      });
      throw error;
    }

    logger.error('Failed to submit recharge', error, {
      endpoint: '/api/brand/wallet/recharge',
      brandId: request.brandId,
      amount: request.amount,
      duration,
    });
    throw new ApiError(500, 'Failed to process recharge');
  }
}

/**
 * Submit a bid for an auction
 * 
 * @param request - Bid request details (auctionId, amount, productName, brandName)
 * @returns Promise<BidResponse> Bid confirmation details
 * @throws ApiError if the request fails or validation errors occur
 * 
 * **Validates: Requirements 15.3, 15.4, 15.5**
 */
export async function submitBid(request: BidRequest): Promise<BidResponse> {
  const startTime = Date.now();
  
  try {
    logger.info('Submitting auction bid', {
      endpoint: '/api/brand/auctions',
      auctionId: request.auctionId,
      amount: request.amount,
      productName: request.productName,
    });
    
    const response = await apiClient.post<{ success: boolean; bid?: BidResponse; error?: string }>(
      '/api/brand/auctions',
      {
        auctionId: request.auctionId,
        amount: request.amount,
        productName: request.productName,
        brandName: request.brandName,
      }
    );

    if (!response.success || !response.bid) {
      const errorMessage = response.error || 'Failed to submit bid';
      throw new ApiError(400, errorMessage);
    }

    const duration = Date.now() - startTime;
    logger.apiRequest('POST', '/api/brand/auctions', 200, duration, {
      auctionId: request.auctionId,
      amount: request.amount,
    });

    logger.auctionEvent(request.auctionId, 'bid_placed', {
      amount: request.amount,
      productName: request.productName,
      brandName: request.brandName,
    });

    return response.bid;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof ApiError) {
      logger.error('Bid submission API error', error, {
        endpoint: '/api/brand/auctions',
        status: error.status,
        auctionId: request.auctionId,
        amount: request.amount,
        duration,
      });
      throw error;
    }

    logger.error('Failed to submit bid', error, {
      endpoint: '/api/brand/auctions',
      auctionId: request.auctionId,
      amount: request.amount,
      duration,
    });
    throw new ApiError(500, 'Failed to submit bid');
  }
}
