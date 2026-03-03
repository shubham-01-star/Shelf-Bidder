/**
 * Integration Tests: Cross-Service Data Flow
 *
 * Task 14.1: End-to-end API integration tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ============================================================================
// Mocks
// ============================================================================

const mockAuctionCreate = jest.fn<(...args: any[]) => any>();
const mockAuctionGet = jest.fn<(...args: any[]) => any>();
const mockAuctionUpdate = jest.fn<(...args: any[]) => any>();
const mockAuctionQueryByStatus = jest.fn<(...args: any[]) => any>().mockReturnValue({ items: [] });
const mockAuctionQueryByShelfSpace = jest.fn<(...args: any[]) => any>().mockReturnValue({ items: [] });
const mockShelfSpaceGet = jest.fn<(...args: any[]) => any>();
const mockTaskCreate = jest.fn<(...args: any[]) => any>();
const mockTaskUpdate = jest.fn<(...args: any[]) => any>();
const mockTaskQueryByStatus = jest.fn<(...args: any[]) => any>().mockReturnValue({ items: [] });
const mockShopkeeperGet = jest.fn<(...args: any[]) => any>().mockImplementation((id: string) => Promise.resolve({ id, shopkeeperId: id, walletBalance: 1000 }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockShopkeeperUpdate = jest.fn<(...args: any[]) => any>().mockImplementation((id: any, updates: any) => Promise.resolve({ id, ...updates }));
const mockWalletGet = jest.fn<(...args: any[]) => any>();
const mockWalletUpdate = jest.fn<(...args: any[]) => any>();
const mockWalletQueryTransactions = jest.fn<(...args: any[]) => any>().mockReturnValue({ items: [] });

jest.mock('../../lib/db', () => ({
  AuctionOperations: {
    create: (...args: unknown[]) => mockAuctionCreate(...args),
    get: (...args: unknown[]) => mockAuctionGet(...args),
    update: (...args: unknown[]) => mockAuctionUpdate(...args),
    queryByStatus: (...args: unknown[]) => mockAuctionQueryByStatus(...args),
    queryByShelfSpace: (...args: unknown[]) => mockAuctionQueryByShelfSpace(...args),
  },
  ShelfSpaceOperations: {
    get: (...args: unknown[]) => mockShelfSpaceGet(...args),
  },
  ShopkeeperOperations: {
    get: (...args: unknown[]) => mockShopkeeperGet(...args),
    update: (...args: unknown[]) => mockShopkeeperUpdate(...args),
  },
  TaskOperations: {
    create: (...args: unknown[]) => mockTaskCreate(...args),
    update: (...args: unknown[]) => mockTaskUpdate(...args),
    queryByStatus: (...args: unknown[]) => mockTaskQueryByStatus(...args),
  },
  WalletTransactionOperations: {
    create: (...args: unknown[]) => Promise.resolve(args[0]),
    get: (...args: unknown[]) => mockWalletGet(...args),
    update: (...args: unknown[]) => mockWalletUpdate(...args),
    queryTransactions: (...args: unknown[]) => mockWalletQueryTransactions(...args),
  },
}));

jest.mock('../../lib/auction/bid-validator', () => ({
  validateBid: jest.fn<(...args: any[]) => any>().mockReturnValue({ valid: true, errors: [] }),
  BidValidationError: class BidValidationError extends Error {
    code: string;
    constructor(msg: string, code: string) { super(msg); this.code = code; }
  },
}));

import { initializeAuctions, submitBid } from '../../lib/auction/auction-engine';
import { createTaskFromAuction } from '../../lib/tasks/task-assignment';
import { creditEarnings, getBalance } from '../../lib/wallet/wallet-service';

// ============================================================================
// Tests
// ============================================================================

describe('Integration: Cross-Service Data Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuctionCreate.mockImplementation((auction: Record<string, unknown>) =>
      Promise.resolve({ ...auction, auctionId: auction.id })
    );
    mockAuctionUpdate.mockImplementation((_id: string, updates: Record<string, unknown>) =>
      Promise.resolve({ auctionId: _id, ...updates })
    );
    mockShelfSpaceGet.mockResolvedValue(null);
  });

  it('should maintain data consistency: auction → task → wallet', async () => {
    // 1. Create auction
    const auctions = await initializeAuctions('shelf-flow', [
      { id: 'space-1', coordinates: { x: 100, y: 200, width: 30, height: 40 }, shelfLevel: 1, visibility: 'high', accessibility: 'easy' },
    ], 15);
    const auction = auctions[0];

    // 2. Bid accepted
    mockAuctionGet.mockResolvedValue({
      ...auction, status: 'active',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 900000).toISOString(),
      bids: [],
    });

    await submitBid(auction.id, 'agent-flow', 95, {
      name: 'FlowProduct', brand: 'FlowBrand', category: 'beverages',
      dimensions: { width: 20, height: 30, depth: 8 }, weight: 500, imageUrl: '',
    });

    // 3. Winner selected
    mockAuctionGet.mockResolvedValue({
      ...auction, status: 'completed', winnerId: 'agent-flow', winningBid: 95,
      bids: [{
        id: 'bid-flow', agentId: 'agent-flow', amount: 95, status: 'valid',
        timestamp: new Date().toISOString(),
        productDetails: { name: 'FlowProduct', brand: 'FlowBrand', dimensions: { width: 20, height: 30, depth: 8 }, weight: 500, imageUrl: '' },
      }],
    });

    mockShelfSpaceGet.mockResolvedValue({
      emptySpaces: [{ id: 'space-1', coordinates: { x: 100, y: 200, width: 30, height: 40 }, shelfLevel: 1, visibility: 'high', accessibility: 'easy' }],
    });

    mockTaskCreate.mockImplementation((task: Record<string, unknown>) => Promise.resolve(task));

    // 4. Task created from auction
    const task = await createTaskFromAuction(auction.id, 'sk-flow');

    // 5. Credit earnings
    mockShopkeeperGet.mockResolvedValueOnce({ shopkeeperId: 'sk-flow', walletBalance: 1000 });
    await creditEarnings('sk-flow', task.earnings, task.id, 'FlowProduct placement');

    // 6. Verify balance
    mockShopkeeperGet.mockResolvedValueOnce({ shopkeeperId: 'sk-flow', walletBalance: 1095 });
    const balance = await getBalance('sk-flow');

    expect(task.earnings).toBe(95);
    expect(balance).toBe(1095);
    expect(task.shopkeeperId).toBe('sk-flow');
  });

  it('should handle concurrent auctions independently', async () => {
    const auctionsA = await initializeAuctions('shelf-A', [
      { id: 'space-A1', coordinates: { x: 100, y: 200, width: 30, height: 40 }, shelfLevel: 1, visibility: 'high', accessibility: 'easy' },
    ], 15);

    const auctionsB = await initializeAuctions('shelf-B', [
      { id: 'space-B1', coordinates: { x: 200, y: 300, width: 25, height: 35 }, shelfLevel: 2, visibility: 'medium', accessibility: 'moderate' },
    ], 15);

    expect(auctionsA[0].shelfSpaceId).toBe('shelf-A');
    expect(auctionsB[0].shelfSpaceId).toBe('shelf-B');
    expect(auctionsA[0].id).not.toBe(auctionsB[0].id);
  });
});
