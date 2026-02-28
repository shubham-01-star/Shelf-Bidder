/**
 * Integration Tests: Complete Daily Workflow
 *
 * Task 14.1: End-to-end workflow integration tests
 * Tests cross-module interactions: Auction → Task → Wallet
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ============================================================================
// Mock database layer
// ============================================================================

const mockAuctionCreate = jest.fn();
const mockAuctionGet = jest.fn();
const mockAuctionUpdate = jest.fn();
const mockAuctionQueryByStatus = jest.fn().mockReturnValue({ items: [] });
const mockAuctionQueryByShelfSpace = jest.fn().mockReturnValue({ items: [] });
const mockShelfSpaceGet = jest.fn();
const mockTaskCreate = jest.fn();
const mockTaskUpdate = jest.fn();
const mockTaskQueryByStatus = jest.fn().mockReturnValue({ items: [] });
// @ts-expect-error - Mock return typing mismatch
const mockShopkeeperGet = jest.fn().mockImplementation((id: string) => Promise.resolve({ id, shopkeeperId: id, walletBalance: 1000 }));
const mockShopkeeperUpdate = jest.fn().mockImplementation((id: unknown, updates: unknown) => Promise.resolve({ id, ...(updates as Record<string, unknown>) }));
const mockWalletGet = jest.fn();
const mockWalletUpdate = jest.fn();
const mockWalletQueryTransactions = jest.fn().mockReturnValue({ items: [] });

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

// Also mock bid-validator so submitBid works
jest.mock('../../lib/auction/bid-validator', () => ({
  validateBid: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  BidValidationError: class BidValidationError extends Error {
    code: string;
    details?: Record<string, unknown>;
    constructor(msg: string, code: string, details?: Record<string, unknown>) {
      super(msg);
      this.code = code;
      this.details = details;
    }
  },
}));

// Import modules under test
import { initializeAuctions, submitBid, selectWinner } from '../../lib/auction/auction-engine';
import { createTaskFromAuction, startTask, completeTask } from '../../lib/tasks/task-assignment';
import { creditEarnings, getBalance, requestPayout } from '../../lib/wallet/wallet-service';

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Complete Daily Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error - Mock return typing mismatch
    mockAuctionCreate.mockImplementation((auction: Record<string, unknown>) =>
      Promise.resolve({ ...auction, auctionId: auction.id || 'test-auction-id' })
    );
    // @ts-expect-error - Mock return typing mismatch
    mockAuctionUpdate.mockImplementation((_id: string, updates: Record<string, unknown>) =>
      Promise.resolve({ auctionId: _id, ...updates })
    );
    // @ts-expect-error - Mock return typing mismatch
    mockShelfSpaceGet.mockResolvedValue(null);
  });

  describe('Auction Initialization Flow', () => {
    it('should create auctions for each empty space', async () => {
      const emptySpaces = [
        { id: 'space-1', coordinates: { x: 100, y: 200, width: 30, height: 40 }, shelfLevel: 2, visibility: 'high', accessibility: 'easy' },
        { id: 'space-2', coordinates: { x: 300, y: 200, width: 25, height: 40 }, shelfLevel: 2, visibility: 'medium', accessibility: 'moderate' },
      ];

      const auctions = await initializeAuctions('shelf-001', emptySpaces, 15);

      expect(auctions).toHaveLength(2);
      expect(auctions[0].status).toBe('active');
      expect(auctions[1].status).toBe('active');
      expect(mockAuctionCreate).toHaveBeenCalledTimes(2);
    });

    it('should return empty array for no empty spaces', async () => {
      const auctions = await initializeAuctions('shelf-001', [], 15);
      expect(auctions).toHaveLength(0);
    });
  });

  describe('Bid & Winner Selection', () => {
    it('should accept bids and select highest as winner', async () => {
      // Setup - simulate active auction
      const auctionId = 'test-auction-1';

      // @ts-expect-error - Mock return typing mismatch
      mockAuctionGet.mockResolvedValue({
        id: auctionId, auctionId, shelfSpaceId: 'shelf-1', status: 'active',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 900000).toISOString(),
        bids: [],
      });

      // Submit a bid
      const updatedAuction = await submitBid(auctionId, 'agent-1', 75, {
        name: 'Pepsi 500ml', brand: 'PepsiCo',
        dimensions: { width: 25, height: 35, depth: 8 }, weight: 500, imageUrl: '',
      });
      expect(updatedAuction).toBeDefined();

      // Now select winner with bids loaded
      // @ts-expect-error - Mock return typing mismatch
      mockAuctionGet.mockResolvedValue({
        id: auctionId, auctionId, shelfSpaceId: 'shelf-1', status: 'active',
        bids: [
          { id: 'bid-1', agentId: 'agent-1', amount: 50, status: 'valid', productDetails: {}, timestamp: new Date().toISOString() },
          { id: 'bid-2', agentId: 'agent-2', amount: 85, status: 'valid', productDetails: {}, timestamp: new Date().toISOString() },
          { id: 'bid-3', agentId: 'agent-3', amount: 60, status: 'valid', productDetails: {}, timestamp: new Date().toISOString() },
        ],
      });

      const result = await selectWinner(auctionId);
      expect(result.winnerId).toBe('agent-2');
      expect(result.winningBid).toBe(85);
      expect(result.status).toBe('completed');
    });

    it('should cancel auction with no bids', async () => {
      // @ts-expect-error - Mock return typing mismatch
      mockAuctionGet.mockResolvedValue({
        id: 'empty-auction', auctionId: 'empty-auction', status: 'active',
        bids: [],
      });

      const result = await selectWinner('empty-auction');
      expect(result.status).toBe('cancelled');
    });
  });

  describe('Task Assignment from Auction', () => {
    it('should create task from completed auction', async () => {
      const auctionId = 'completed-auction';

      // @ts-expect-error - Mock return typing mismatch
      mockAuctionGet.mockResolvedValue({
        id: auctionId, auctionId, shelfSpaceId: 'shelf-1', status: 'completed',
        winnerId: 'agent-brand', winningBid: 75,
        bids: [
          {
            id: 'bid-1', agentId: 'agent-brand', amount: 75, status: 'valid',
            timestamp: new Date().toISOString(),
            productDetails: { name: 'TestProduct', brand: 'TestBrand', dimensions: { width: 20, height: 30, depth: 8 }, weight: 500, imageUrl: '' },
          },
        ],
      });

      // @ts-expect-error - Mock return typing mismatch
      mockShelfSpaceGet.mockResolvedValue({
        emptySpaces: [{ id: 'space-1', coordinates: { x: 100, y: 200, width: 30, height: 40 }, shelfLevel: 2, visibility: 'high', accessibility: 'easy' }],
      });

      // @ts-expect-error - Mock return typing mismatch
      mockTaskCreate.mockImplementation((task: Record<string, unknown>) => Promise.resolve(task));

      const task = await createTaskFromAuction(auctionId, 'shopkeeper-1');
      expect(task).toBeDefined();
      expect(task.status).toBe('assigned');
      expect(task.earnings).toBe(75);
      expect(task.shopkeeperId).toBe('shopkeeper-1');
    });

    it('should reject task for non-completed auction', async () => {
      // @ts-expect-error - Mock return typing mismatch
      mockAuctionGet.mockResolvedValue({ status: 'active', bids: [] });
      await expect(createTaskFromAuction('active-auction', 'sk-1')).rejects.toThrow();
    });
  });

  describe('Task Lifecycle', () => {
    it('should support full lifecycle: assign → start → complete', async () => {
      const assignedDate = new Date().toISOString();

      // Start task
      // @ts-expect-error - Mock return typing mismatch
      mockTaskUpdate.mockResolvedValue({ id: 'task-1', status: 'in_progress' });
      const started = await startTask('task-1', 'sk-1', assignedDate);
      expect(started.status).toBe('in_progress');

      // Complete task with proof
      // @ts-expect-error - Mock return typing mismatch
      mockTaskUpdate.mockResolvedValue({ id: 'task-1', status: 'completed', proofPhotoUrl: 'https://proof.jpg' });
      const completed = await completeTask('task-1', 'sk-1', assignedDate, 'https://proof.jpg');
      expect(completed.status).toBe('completed');
    });
  });

  describe('Wallet Earnings', () => {
    it('should credit earnings and return balance', async () => {
      // @ts-expect-error - Mock return typing mismatch
      mockShopkeeperGet.mockResolvedValueOnce({ shopkeeperId: 'sk-1', walletBalance: 1000 });
      // @ts-expect-error - Mock return typing mismatch
      mockShopkeeperUpdate.mockResolvedValue(undefined);

      const tx = await creditEarnings('sk-1', 75, 'task-1', 'Pepsi placement');
      expect(tx).toBeDefined();
      expect(tx.type).toBe('earning');
      expect(tx.amount).toBe(75);

      // Check balance
      // @ts-expect-error - Mock return typing mismatch
      mockShopkeeperGet.mockResolvedValueOnce({ shopkeeperId: 'sk-1', walletBalance: 1075 });
      const balance = await getBalance('sk-1');
      expect(balance).toBe(1075);
    });

    it('should reject payout below threshold', async () => {
      // @ts-expect-error - Mock return typing mismatch
      mockShopkeeperGet.mockResolvedValue({ shopkeeperId: 'sk-low', walletBalance: 50 });
      await expect(requestPayout('sk-low', 50)).rejects.toThrow();
    });
  });
});
