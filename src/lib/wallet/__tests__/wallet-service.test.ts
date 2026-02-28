/**
 * Unit tests for Wallet Service
 * Task 9.1: Wallet transaction processing
 * Task 9.2: Payout system
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Shopkeeper, WalletTransaction } from '@/types/models';

// ============================================================================
// Mocks
// ============================================================================

const mockTxnCreate = jest.fn();
const mockTxnGet = jest.fn();
const mockTxnUpdateStatus = jest.fn();
const mockTxnQueryByShopkeeper = jest.fn();
const mockShopkeeperGet = jest.fn();
const mockShopkeeperUpdate = jest.fn();

jest.mock('@/lib/db', () => ({
  WalletTransactionOperations: {
    create: (...args: unknown[]) => mockTxnCreate(...args),
    get: (...args: unknown[]) => mockTxnGet(...args),
    updateStatus: (...args: unknown[]) => mockTxnUpdateStatus(...args),
    queryByShopkeeper: (...args: unknown[]) => mockTxnQueryByShopkeeper(...args),
  },
  ShopkeeperOperations: {
    get: (...args: unknown[]) => mockShopkeeperGet(...args),
    update: (...args: unknown[]) => mockShopkeeperUpdate(...args),
  },
}));

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-wallet',
}));

import {
  creditEarnings,
  getBalance,
  getTransactionHistory,
  getEarningsSummary,
  checkPayoutEligibility,
  requestPayout,
  failPayout,
  WalletError,
  PAYOUT_THRESHOLD,
} from '../wallet-service';

// ============================================================================
// Test Data
// ============================================================================

const mockShopkeeper: Shopkeeper = {
  id: 'shop-123',
  name: 'Ramesh Kumar',
  phoneNumber: '+919876543210',
  storeAddress: '123 Main Street, Mumbai',
  preferredLanguage: 'hi',
  timezone: 'Asia/Kolkata',
  walletBalance: 500,
  registrationDate: '2024-01-01T00:00:00.000Z',
  lastActiveDate: '2024-01-15T10:30:00.000Z',
};

// ============================================================================
// Tests
// ============================================================================

describe('creditEarnings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create a transaction and update balance', async () => {
    mockTxnCreate.mockResolvedValueOnce({});
    mockShopkeeperGet.mockResolvedValueOnce({ ...mockShopkeeper, walletBalance: 100 });
    mockShopkeeperUpdate.mockResolvedValueOnce({});

    const result = await creditEarnings('shop-123', 50, 'task-1');

    expect(result.amount).toBe(50);
    expect(result.type).toBe('earning');
    expect(result.status).toBe('completed');
    expect(result.shopkeeperId).toBe('shop-123');
    expect(mockTxnCreate).toHaveBeenCalledTimes(1);
    expect(mockShopkeeperUpdate).toHaveBeenCalledWith('shop-123', expect.objectContaining({
      walletBalance: 150, // 100 + 50
    }));
  });

  it('should reject zero amount', async () => {
    await expect(creditEarnings('shop-123', 0, 'task-1')).rejects.toThrow(WalletError);
  });

  it('should reject negative amount', async () => {
    await expect(creditEarnings('shop-123', -10, 'task-1')).rejects.toThrow(WalletError);
  });
});

describe('getBalance', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return current wallet balance', async () => {
    mockShopkeeperGet.mockResolvedValueOnce({ ...mockShopkeeper, walletBalance: 250 });

    const balance = await getBalance('shop-123');

    expect(balance).toBe(250);
  });
});

describe('getTransactionHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return transactions for a shopkeeper', async () => {
    const mockTransactions: WalletTransaction[] = [
      {
        id: 'txn-1',
        shopkeeperId: 'shop-123',
        type: 'earning',
        amount: 50,
        description: 'Task payment',
        taskId: 'task-1',
        timestamp: '2024-01-15T10:00:00.000Z',
        status: 'completed',
      },
    ];

    mockTxnQueryByShopkeeper.mockResolvedValueOnce({
      items: mockTransactions,
      count: 1,
    });

    const result = await getTransactionHistory('shop-123');

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(50);
  });
});

describe('getEarningsSummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should calculate correct earnings summary', async () => {
    const mockTransactions: WalletTransaction[] = [
      {
        id: 'txn-1', shopkeeperId: 'shop-123', type: 'earning',
        amount: 50, description: 'Task 1', timestamp: new Date().toISOString(),
        status: 'completed',
      },
      {
        id: 'txn-2', shopkeeperId: 'shop-123', type: 'earning',
        amount: 75, description: 'Task 2', timestamp: new Date().toISOString(),
        status: 'completed',
      },
      {
        id: 'txn-3', shopkeeperId: 'shop-123', type: 'payout',
        amount: 30, description: 'Payout', timestamp: new Date().toISOString(),
        status: 'completed',
      },
    ];

    mockTxnQueryByShopkeeper.mockResolvedValueOnce({
      items: mockTransactions,
      count: 3,
    });

    const summary = await getEarningsSummary('shop-123', 7);

    expect(summary.totalEarnings).toBe(125); // 50 + 75
    expect(summary.totalPayouts).toBe(30);
    expect(summary.netBalance).toBe(95); // 125 - 30
    expect(summary.transactionCount).toBe(3);
  });

  it('should return zeros when no transactions', async () => {
    mockTxnQueryByShopkeeper.mockResolvedValueOnce({
      items: [],
      count: 0,
    });

    const summary = await getEarningsSummary('shop-123');

    expect(summary.totalEarnings).toBe(0);
    expect(summary.totalPayouts).toBe(0);
    expect(summary.netBalance).toBe(0);
  });
});

describe('checkPayoutEligibility', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should be eligible when balance >= threshold', async () => {
    mockShopkeeperGet.mockResolvedValueOnce({ ...mockShopkeeper, walletBalance: 200 });

    const result = await checkPayoutEligibility('shop-123');

    expect(result.eligible).toBe(true);
    expect(result.balance).toBe(200);
    expect(result.threshold).toBe(PAYOUT_THRESHOLD);
  });

  it('should not be eligible when balance < threshold', async () => {
    mockShopkeeperGet.mockResolvedValueOnce({ ...mockShopkeeper, walletBalance: 50 });

    const result = await checkPayoutEligibility('shop-123');

    expect(result.eligible).toBe(false);
    expect(result.balance).toBe(50);
  });
});

describe('requestPayout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create payout transaction and deduct balance', async () => {
    mockShopkeeperGet.mockResolvedValueOnce({ ...mockShopkeeper, walletBalance: 500 });
    mockTxnCreate.mockResolvedValueOnce({});
    mockShopkeeperUpdate.mockResolvedValueOnce({});

    const result = await requestPayout('shop-123', 200);

    expect(result.type).toBe('payout');
    expect(result.amount).toBe(200);
    expect(result.status).toBe('pending');
    expect(mockShopkeeperUpdate).toHaveBeenCalledWith('shop-123', expect.objectContaining({
      walletBalance: 300, // 500 - 200
    }));
  });

  it('should payout full balance when no amount specified', async () => {
    mockShopkeeperGet.mockResolvedValueOnce({ ...mockShopkeeper, walletBalance: 500 });
    mockTxnCreate.mockResolvedValueOnce({});
    mockShopkeeperUpdate.mockResolvedValueOnce({});

    const result = await requestPayout('shop-123');

    expect(result.amount).toBe(500);
    expect(mockShopkeeperUpdate).toHaveBeenCalledWith('shop-123', expect.objectContaining({
      walletBalance: 0,
    }));
  });

  it('should reject payout exceeding balance', async () => {
    mockShopkeeperGet.mockResolvedValueOnce({ ...mockShopkeeper, walletBalance: 100 });

    await expect(requestPayout('shop-123', 500)).rejects.toThrow('Insufficient balance');
  });

  it('should reject payout below threshold', async () => {
    mockShopkeeperGet.mockResolvedValueOnce({ ...mockShopkeeper, walletBalance: 50 });

    await expect(requestPayout('shop-123', 30)).rejects.toThrow('threshold');
  });

  it('should reject payout exceeding max limit', async () => {
    mockShopkeeperGet.mockResolvedValueOnce({ ...mockShopkeeper, walletBalance: 50000 });

    await expect(requestPayout('shop-123', 15000)).rejects.toThrow('maximum limit');
  });
});

describe('failPayout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should refund amount and mark transaction as failed', async () => {
    const mockTxn: WalletTransaction = {
      id: 'txn-payout', shopkeeperId: 'shop-123', type: 'payout',
      amount: 200, description: 'Payout', timestamp: '2024-01-15T10:00:00.000Z',
      status: 'pending',
    };

    mockTxnGet.mockResolvedValueOnce(mockTxn);
    mockShopkeeperGet.mockResolvedValueOnce({ ...mockShopkeeper, walletBalance: 300 });
    mockShopkeeperUpdate.mockResolvedValueOnce({});
    mockTxnUpdateStatus.mockResolvedValueOnce({ ...mockTxn, status: 'failed' });

    const result = await failPayout('txn-payout', 'shop-123', '2024-01-15T10:00:00.000Z');

    expect(result.status).toBe('failed');
    expect(mockShopkeeperUpdate).toHaveBeenCalledWith('shop-123', expect.objectContaining({
      walletBalance: 500, // 300 + 200 refund
    }));
  });
});
