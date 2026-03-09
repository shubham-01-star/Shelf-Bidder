/**
 * Unit tests for Wallet Service
 * Task 9.1: Wallet transaction processing
 * Task 9.2: Payout system
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ============================================================================
// Mocks
// ============================================================================

const mockTxnCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockTxnGetById = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockTxnQueryByShopkeeper = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockShopkeeperGetByShopkeeperId = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockProcessPayout = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockQuery = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.mock('@/lib/db/postgres/operations', () => ({
  WalletTransactionOperations: {
    create: (...args: unknown[]) => mockTxnCreate(...args),
    getById: (...args: unknown[]) => mockTxnGetById(...args),
    queryByShopkeeper: (...args: unknown[]) => mockTxnQueryByShopkeeper(...args),
  },
  ShopkeeperOperations: {
    getByShopkeeperId: (...args: unknown[]) => mockShopkeeperGetByShopkeeperId(...args),
  },
  TransactionOperations: {
    processPayout: (...args: unknown[]) => mockProcessPayout(...args),
  },
}));

jest.mock('@/lib/db/postgres/client', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

jest.mock('@/lib/db/postgres/mappers', () => ({
  WalletTransactionMapper: {
    fromRow: (row: unknown) => row,
  },
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
// Test Data (PostgreSQL snake_case format)
// ============================================================================

const mockShopkeeper = {
  id: 'uuid-123',
  shopkeeper_id: 'shop-123',
  name: 'Ramesh Kumar',
  phone_number: '+919876543210',
  store_address: '123 Main Street, Mumbai',
  preferred_language: 'hi',
  timezone: 'Asia/Kolkata',
  wallet_balance: 500,
  registration_date: new Date('2024-01-01'),
  last_active_date: new Date('2024-01-15'),
  created_at: new Date(),
  updated_at: new Date(),
};

// ============================================================================
// Tests
// ============================================================================

describe('creditEarnings', () => {
  beforeEach(() => { jest.clearAllMocks(); return undefined; });

  it('should create a transaction and update balance', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce(mockShopkeeper);
    const mockTxn = {
      id: 'txn-1',
      shopkeeper_id: 'shop-123',
      type: 'earning',
      amount: 50,
      description: 'Task completion payment',
      status: 'completed',
      transaction_date: new Date(),
    };
    mockTxnCreate.mockResolvedValueOnce(mockTxn);

    const result = await creditEarnings('shop-123', 50, 'task-1');

    expect(result.amount).toBe(50);
    expect(result.type).toBe('earning');
    expect(result.status).toBe('completed');
    expect(mockTxnCreate).toHaveBeenCalledWith({
      shopkeeper_id: 'uuid-123',
      task_id: 'task-1',
      type: 'earning',
      amount: 50,
      description: 'Task completion payment',
    });
  });

  it('should reject zero amount', async () => {
    await expect(creditEarnings('shop-123', 0, 'task-1')).rejects.toThrow(WalletError);
  });

  it('should reject negative amount', async () => {
    await expect(creditEarnings('shop-123', -10, 'task-1')).rejects.toThrow(WalletError);
  });
});

describe('getBalance', () => {
  beforeEach(() => { jest.clearAllMocks(); return undefined; });

  it('should return current wallet balance', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce({ ...mockShopkeeper, wallet_balance: 250 });

    const balance = await getBalance('shop-123');

    expect(balance).toBe(250);
    expect(mockShopkeeperGetByShopkeeperId).toHaveBeenCalledWith('shop-123');
  });
});

describe('getTransactionHistory', () => {
  beforeEach(() => { jest.clearAllMocks(); return undefined; });

  it('should return transactions for a shopkeeper', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce(mockShopkeeper);
    const mockTransactions = [
      {
        id: 'txn-1',
        shopkeeper_id: 'shop-123',
        type: 'earning',
        amount: 50,
        description: 'Task payment',
        transaction_date: new Date('2024-01-15'),
        status: 'completed',
      },
    ];

    mockTxnQueryByShopkeeper.mockResolvedValueOnce({
      items: mockTransactions,
      total: 1,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });

    const result = await getTransactionHistory('shop-123');

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(50);
  });
});

describe('getEarningsSummary', () => {
  beforeEach(() => { jest.clearAllMocks(); return undefined; });

  it('should calculate correct earnings summary', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce(mockShopkeeper);
    const mockTransactions = [
      {
        id: 'txn-1', shopkeeper_id: 'shop-123', type: 'earning',
        amount: 50, description: 'Task 1', transaction_date: new Date(),
        status: 'completed',
      },
      {
        id: 'txn-2', shopkeeper_id: 'shop-123', type: 'earning',
        amount: 75, description: 'Task 2', transaction_date: new Date(),
        status: 'completed',
      },
      {
        id: 'txn-3', shopkeeper_id: 'shop-123', type: 'payout',
        amount: 30, description: 'Payout', transaction_date: new Date(),
        status: 'completed',
      },
    ];

    mockTxnQueryByShopkeeper.mockResolvedValueOnce({
      items: mockTransactions,
      total: 3,
      page: 1,
      pageSize: 1000,
      hasMore: false,
    });

    const summary = await getEarningsSummary('shop-123', 7);

    expect(summary.totalEarnings).toBe(125); // 50 + 75
    expect(summary.totalPayouts).toBe(30);
    expect(summary.netBalance).toBe(95); // 125 - 30
    expect(summary.transactionCount).toBe(3);
  });

  it('should return zeros when no transactions', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce(mockShopkeeper);
    mockTxnQueryByShopkeeper.mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      pageSize: 1000,
      hasMore: false,
    });

    const summary = await getEarningsSummary('shop-123');

    expect(summary.totalEarnings).toBe(0);
    expect(summary.totalPayouts).toBe(0);
    expect(summary.netBalance).toBe(0);
  });
});

describe('checkPayoutEligibility', () => {
  beforeEach(() => { jest.clearAllMocks(); return undefined; });

  it('should be eligible when balance >= threshold', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce({ ...mockShopkeeper, wallet_balance: 200 });

    const result = await checkPayoutEligibility('shop-123');

    expect(result.eligible).toBe(true);
    expect(result.balance).toBe(200);
    expect(result.threshold).toBe(PAYOUT_THRESHOLD);
  });

  it('should not be eligible when balance < threshold', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce({ ...mockShopkeeper, wallet_balance: 50 });

    const result = await checkPayoutEligibility('shop-123');

    expect(result.eligible).toBe(false);
    expect(result.balance).toBe(50);
  });
});

describe('requestPayout', () => {
  beforeEach(() => { jest.clearAllMocks(); return undefined; });

  it('should create payout transaction and deduct balance', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce({ ...mockShopkeeper, wallet_balance: 500 });
    const mockTxn = {
      id: 'txn-payout', shopkeeper_id: 'shop-123', type: 'payout',
      amount: 200, description: 'Payout request - ₹200',
      status: 'pending', transaction_date: new Date(),
    };
    mockProcessPayout.mockResolvedValueOnce({ transaction: mockTxn, newBalance: 300 });

    const result = await requestPayout('shop-123', 200);

    expect(result.type).toBe('payout');
    expect(result.amount).toBe(200);
    expect(mockProcessPayout).toHaveBeenCalledWith('uuid-123', 200, 'Payout request - ₹200');
  });

  it('should payout full balance when no amount specified', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce({ ...mockShopkeeper, wallet_balance: 500 });
    const mockTxn = {
      id: 'txn-payout', shopkeeper_id: 'shop-123', type: 'payout',
      amount: 500, status: 'pending', transaction_date: new Date(),
    };
    mockProcessPayout.mockResolvedValueOnce({ transaction: mockTxn, newBalance: 0 });

    const result = await requestPayout('shop-123');

    expect(result.amount).toBe(500);
    expect(mockProcessPayout).toHaveBeenCalledWith('uuid-123', 500, 'Payout request - ₹500');
  });

  it('should reject payout exceeding balance', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce({ ...mockShopkeeper, wallet_balance: 100 });

    await expect(requestPayout('shop-123', 500)).rejects.toThrow('Insufficient balance');
  });

  it('should reject payout below threshold', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce({ ...mockShopkeeper, wallet_balance: 50 });

    await expect(requestPayout('shop-123', 30)).rejects.toThrow('threshold');
  });

  it('should reject payout exceeding max limit', async () => {
    mockShopkeeperGetByShopkeeperId.mockResolvedValueOnce({ ...mockShopkeeper, wallet_balance: 50000 });

    await expect(requestPayout('shop-123', 15000)).rejects.toThrow('maximum limit');
  });
});

describe('failPayout', () => {
  beforeEach(() => { jest.clearAllMocks(); return undefined; });

  it('should refund amount and mark transaction as failed', async () => {
    const mockTxn = {
      id: 'txn-payout', shopkeeper_id: 'shop-123', type: 'payout',
      amount: 200, description: 'Payout', transaction_date: new Date(),
      status: 'pending',
    };

    mockTxnGetById.mockResolvedValueOnce(mockTxn);
    // Mock refund query
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    // Mock update status query
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...mockTxn, status: 'failed' }],
      rowCount: 1,
    });

    const result = await failPayout('txn-payout', 'shop-123');

    expect(result.status).toBe('failed');
    expect(mockTxnGetById).toHaveBeenCalledWith('txn-payout');
  });
});
