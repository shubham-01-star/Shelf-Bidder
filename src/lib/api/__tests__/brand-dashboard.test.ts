/**
 * Unit Tests for Brand Dashboard API Client
 * Feature: brand-dashboard-redesign
 * Task 2.3: Create API client utility functions
 */

import {
  fetchDashboardMetrics,
  fetchProducts,
  fetchAuctions,
  fetchTransactions,
  submitRecharge,
  submitBid,
} from '../brand-dashboard';
import { apiClient, ApiError } from '../../api-client';
import { logger } from '../../logger';

// Mock dependencies
jest.mock('../../api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string, public data?: unknown) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

jest.mock('../../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    apiRequest: jest.fn(),
    walletTransaction: jest.fn(),
    auctionEvent: jest.fn(),
  },
}));

describe('Brand Dashboard API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchDashboardMetrics', () => {
    it('should fetch and transform dashboard metrics successfully', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          brandId: 'brand-001',
          walletBalance: 50000,
          activeCampaigns: 5,
          remainingBudget: 30000,
          totalSpent: 20000,
          successfulPlacements: 150,
          recentActivity: [],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const result = await fetchDashboardMetrics();

      expect(result).toEqual({
        activeCampaigns: 5,
        totalSpent: 20000,
        auctionsWon: 0,
        walletBalance: 50000,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/brand/dashboard');
      expect(logger.info).toHaveBeenCalledWith(
        'Fetching dashboard metrics',
        { endpoint: '/api/brand/dashboard' }
      );
      expect(logger.apiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/brand/dashboard',
        200,
        expect.any(Number)
      );
    });

    it('should throw ApiError when API returns success: false', async () => {
      const mockApiResponse = {
        success: false,
        error: 'Database connection failed',
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      await expect(fetchDashboardMetrics()).rejects.toThrow('Failed to fetch dashboard metrics');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network timeout');
      (apiClient.get as jest.Mock).mockRejectedValue(networkError);

      await expect(fetchDashboardMetrics()).rejects.toThrow(ApiError);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch dashboard metrics',
        networkError,
        expect.objectContaining({
          endpoint: '/api/brand/dashboard',
        })
      );
    });
  });

  describe('fetchProducts', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [
        {
          id: 'prod-001',
          name: 'Diet Coke 330ml',
          brand: 'Coca-Cola',
          category: 'Beverages',
          dimensions: { width: 6, height: 12, depth: 6 },
        },
        {
          id: 'prod-002',
          name: 'Lays Classic 50g',
          brand: 'Lays',
          category: 'Snacks',
          dimensions: { width: 15, height: 20, depth: 5 },
        },
      ];

      const mockApiResponse = {
        success: true,
        data: {
          products: mockProducts,
          count: 2,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const result = await fetchProducts();

      expect(result).toEqual(mockProducts);
      expect(apiClient.get).toHaveBeenCalledWith('/api/brand/products');
      expect(logger.apiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/brand/products',
        200,
        expect.any(Number)
      );
    });

    it('should return empty array when no products exist', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          products: [],
          count: 0,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const result = await fetchProducts();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const apiError = new ApiError(500, 'Internal server error');
      (apiClient.get as jest.Mock).mockRejectedValue(apiError);

      await expect(fetchProducts()).rejects.toThrow(ApiError);
      expect(logger.error).toHaveBeenCalledWith(
        'Products API error',
        apiError,
        expect.objectContaining({
          endpoint: '/api/brand/products',
          status: 500,
        })
      );
    });
  });

  describe('fetchAuctions', () => {
    it('should fetch active auctions successfully', async () => {
      const mockAuctions = [
        {
          id: 'auc-001',
          shelfLocation: 'Premium Endcap',
          shopkeeperArea: 'Downtown Delhi',
          spaceSize: '50x50 cm',
          shelfLevel: 3,
          visibility: 'High' as const,
          currentBids: 2,
          highestBid: 250,
          basePrice: 200,
          endsIn: '45 min',
          status: 'active' as const,
        },
      ];

      const mockApiResponse = {
        success: true,
        data: mockAuctions,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const result = await fetchAuctions();

      expect(result).toEqual(mockAuctions);
      expect(apiClient.get).toHaveBeenCalledWith('/api/brand/auctions');
      expect(logger.apiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/brand/auctions',
        200,
        expect.any(Number)
      );
    });

    it('should handle empty auctions list', async () => {
      const mockApiResponse = {
        success: true,
        data: [],
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const result = await fetchAuctions();

      expect(result).toEqual([]);
    });
  });

  describe('fetchTransactions', () => {
    it('should fetch and transform transaction history', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          brandId: 'brand-001',
          transactions: [
            {
              transactionId: 'txn-001',
              orderId: 'order-001',
              brandId: 'brand-001',
              amount: 10000,
              status: 'completed',
              paymentMethod: 'card',
              timestamp: '2024-01-15T10:00:00Z',
            },
            {
              transactionId: 'txn-002',
              orderId: 'order-002',
              brandId: 'brand-001',
              amount: 25000,
              status: 'completed',
              paymentMethod: 'upi',
              timestamp: '2024-01-20T14:30:00Z',
            },
          ],
          totalRecharges: 2,
          totalAmount: 35000,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      const result = await fetchTransactions('brand-001');

      expect(result).toEqual([
        {
          transactionId: 'txn-001',
          type: 'recharge',
          amount: 10000,
          timestamp: '2024-01-15T10:00:00Z',
          status: 'completed',
        },
        {
          transactionId: 'txn-002',
          type: 'recharge',
          amount: 25000,
          timestamp: '2024-01-20T14:30:00Z',
          status: 'completed',
        },
      ]);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/brand/wallet/recharge?brandId=brand-001'
      );
      expect(logger.apiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/brand/wallet/recharge',
        200,
        expect.any(Number),
        { brandId: 'brand-001' }
      );
    });

    it('should handle URL encoding for brandId', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          brandId: 'brand@special#id',
          transactions: [],
          totalRecharges: 0,
          totalAmount: 0,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      await fetchTransactions('brand@special#id');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/brand/wallet/recharge?brandId=brand%40special%23id'
      );
    });
  });

  describe('submitRecharge', () => {
    it('should submit recharge request successfully', async () => {
      const mockRequest = {
        brandId: 'brand-001',
        amount: 10000,
        paymentMethod: 'card' as const,
      };

      const mockApiResponse = {
        success: true,
        data: {
          transactionId: 'txn-recharge-123',
          orderId: 'order-123',
          brandId: 'brand-001',
          amount: 10000,
          newBalance: 60000,
          status: 'completed',
          paymentMethod: 'card',
          message: 'Successfully recharged ₹10000 to your brand wallet',
          timestamp: '2024-01-25T10:00:00Z',
          gateway: {
            provider: 'Razorpay',
            paymentId: 'pay_123',
            signature: 'fake_signature',
          },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse);

      const result = await submitRecharge(mockRequest);

      expect(result).toEqual(mockApiResponse.data);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/brand/wallet/recharge',
        mockRequest
      );
      expect(logger.walletTransaction).toHaveBeenCalledWith(
        'brand-001',
        10000,
        'recharge',
        expect.objectContaining({
          transactionId: 'txn-recharge-123',
          newBalance: 60000,
        })
      );
    });

    it('should validate minimum recharge amount', async () => {
      const mockRequest = {
        brandId: 'brand-001',
        amount: 500, // Below minimum of 1000
        paymentMethod: 'card' as const,
      };

      await expect(submitRecharge(mockRequest)).rejects.toThrow(ApiError);
      await expect(submitRecharge(mockRequest)).rejects.toThrow(
        'Minimum recharge amount is ₹1000'
      );

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should handle recharge failure', async () => {
      const mockRequest = {
        brandId: 'brand-001',
        amount: 10000,
        paymentMethod: 'card' as const,
      };

      const mockApiResponse = {
        success: false,
        error: 'Payment gateway timeout',
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse);

      await expect(submitRecharge(mockRequest)).rejects.toThrow(
        'Failed to process recharge'
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('submitBid', () => {
    it('should submit bid successfully', async () => {
      const mockRequest = {
        auctionId: 'auc-001',
        amount: 300,
        productName: 'Diet Coke 330ml',
        brandName: 'Coca-Cola',
      };

      const mockApiResponse = {
        success: true,
        bid: {
          id: 'bid-123',
          agentId: 'brand-001',
          amount: 300,
          productDetails: {
            name: 'Diet Coke 330ml',
            brand: 'Coca-Cola',
            category: 'FMCG',
            dimensions: { width: 10, height: 20 },
          },
          timestamp: '2024-01-25T10:00:00Z',
          status: 'valid',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse);

      const result = await submitBid(mockRequest);

      expect(result).toEqual(mockApiResponse.bid);
      expect(apiClient.post).toHaveBeenCalledWith('/api/brand/auctions', mockRequest);
      expect(logger.auctionEvent).toHaveBeenCalledWith(
        'auc-001',
        'bid_placed',
        expect.objectContaining({
          amount: 300,
          productName: 'Diet Coke 330ml',
          brandName: 'Coca-Cola',
        })
      );
    });

    it('should handle bid rejection', async () => {
      const mockRequest = {
        auctionId: 'auc-001',
        amount: 100,
        productName: 'Diet Coke 330ml',
        brandName: 'Coca-Cola',
      };

      const mockApiResponse = {
        success: false,
        error: 'Bid must be higher than current highest bid',
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse);

      await expect(submitBid(mockRequest)).rejects.toThrow(
        'Bid must be higher than current highest bid'
      );
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle API errors during bid submission', async () => {
      const mockRequest = {
        auctionId: 'auc-001',
        amount: 300,
        productName: 'Diet Coke 330ml',
        brandName: 'Coca-Cola',
      };

      const apiError = new ApiError(500, 'Internal server error');
      (apiClient.post as jest.Mock).mockRejectedValue(apiError);

      await expect(submitBid(mockRequest)).rejects.toThrow(ApiError);
      expect(logger.error).toHaveBeenCalledWith(
        'Bid submission API error',
        apiError,
        expect.objectContaining({
          endpoint: '/api/brand/auctions',
          status: 500,
          auctionId: 'auc-001',
        })
      );
    });
  });

  describe('Error Handling and Logging', () => {
    it('should log all API requests with timing', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          brandId: 'brand-001',
          walletBalance: 50000,
          activeCampaigns: 5,
          remainingBudget: 30000,
          totalSpent: 20000,
          successfulPlacements: 150,
          recentActivity: [],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse);

      await fetchDashboardMetrics();

      expect(logger.info).toHaveBeenCalledWith(
        'Fetching dashboard metrics',
        expect.any(Object)
      );
      expect(logger.apiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/brand/dashboard',
        200,
        expect.any(Number)
      );
    });

    it('should log errors with context', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValue(error);

      await expect(fetchDashboardMetrics()).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch dashboard metrics',
        error,
        expect.objectContaining({
          endpoint: '/api/brand/dashboard',
          duration: expect.any(Number),
        })
      );
    });
  });
});
