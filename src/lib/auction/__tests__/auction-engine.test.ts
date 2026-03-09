/**
 * Unit tests for Auction Engine
 * Task 5.1: Auction management functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type {
  Auction,
  EmptySpace,
  AuctionStatus,
} from '../../../types/models';

// ============================================================================
// Mocks
// ============================================================================

const mockCreate = jest.fn<(...args: any[]) => any>();
const mockGet = jest.fn<(...args: any[]) => any>();
const mockUpdate = jest.fn<(...args: any[]) => any>();
const mockQueryByStatus = jest.fn<(...args: any[]) => any>();
const mockQueryByShelfSpace = jest.fn<(...args: any[]) => any>();
const mockShelfSpaceGet = jest.fn<(...args: any[]) => any>();

jest.mock('@/lib/db', () => ({
  AuctionOperations: {
    create: (...args: unknown[]) => mockCreate(...args),
    get: (...args: unknown[]) => mockGet(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    queryByStatus: (...args: unknown[]) => mockQueryByStatus(...args),
    queryByShelfSpace: (...args: unknown[]) => mockQueryByShelfSpace(...args),
  },
  ShelfSpaceOperations: {
    get: (...args: unknown[]) => mockShelfSpaceGet(...args),
  },
}));

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

import {
  initializeAuctions,
  selectWinner,
  cancelAuction,
  getActiveAuctions,
} from '../auction-engine';
import { BidValidationError } from '../bid-validator';

// ============================================================================
// Test Data
// ============================================================================

const mockEmptySpaces: EmptySpace[] = [
  {
    id: 'space-1',
    coordinates: { x: 0, y: 0, width: 300, height: 150 },
    shelfLevel: 2,
    visibility: 'high',
    accessibility: 'easy',
  },
  {
    id: 'space-2',
    coordinates: { x: 400, y: 0, width: 200, height: 100 },
    shelfLevel: 3,
    visibility: 'medium',
    accessibility: 'moderate',
  },
];

const createActiveAuction = (bids: Auction['bids'] = []): Auction => ({
  id: 'auction-1',
  shelfSpaceId: 'shelf-1',
  startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  status: 'active',
  bids,
});

// ============================================================================
// Tests
// ============================================================================

describe('initializeAuctions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create one auction per empty space', async () => {
    mockCreate.mockImplementation((auction: unknown) =>
      Promise.resolve(auction as Auction)
    );

    const result = await initializeAuctions('shelf-1', mockEmptySpaces);

    expect(result).toHaveLength(2);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('should set auction status to active', async () => {
    mockCreate.mockImplementation((auction: unknown) =>
      Promise.resolve(auction as Auction)
    );

    const result = await initializeAuctions('shelf-1', mockEmptySpaces);

    result.forEach((auction) => {
      expect(auction.status).toBe('active');
    });
  });

  it('should set correct shelfSpaceId', async () => {
    mockCreate.mockImplementation((auction: unknown) =>
      Promise.resolve(auction as Auction)
    );

    const result = await initializeAuctions('shelf-123', mockEmptySpaces);

    result.forEach((auction) => {
      expect(auction.shelfSpaceId).toBe('shelf-123');
    });
  });

  it('should set correct duration', async () => {
    mockCreate.mockImplementation((auction: unknown) =>
      Promise.resolve(auction as Auction)
    );

    const result = await initializeAuctions('shelf-1', mockEmptySpaces, 30);

    result.forEach((auction) => {
      const start = new Date(auction.startTime).getTime();
      const end = new Date(auction.endTime).getTime();
      const durationMs = end - start;
      // Allow 1 second tolerance for test execution time
      expect(durationMs).toBeGreaterThanOrEqual(29 * 60 * 1000);
      expect(durationMs).toBeLessThanOrEqual(31 * 60 * 1000);
    });
  });

  it('should return empty array when no empty spaces', async () => {
    const result = await initializeAuctions('shelf-1', []);

    expect(result).toHaveLength(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should initialize with empty bids array', async () => {
    mockCreate.mockImplementation((auction: unknown) =>
      Promise.resolve(auction as Auction)
    );

    const result = await initializeAuctions('shelf-1', [mockEmptySpaces[0]]);

    expect(result[0].bids).toEqual([]);
  });
});

describe('selectWinner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should select highest bid as winner', async () => {
    const auction = createActiveAuction([
      {
        id: 'bid-1',
        agentId: 'agent-1',
        amount: 30,
        productDetails: {
          name: 'Product A',
          brand: 'Brand A',
          category: 'Cat',
          dimensions: { width: 10, height: 10 },
        },
        timestamp: new Date().toISOString(),
        status: 'valid',
      },
      {
        id: 'bid-2',
        agentId: 'agent-2',
        amount: 75,
        productDetails: {
          name: 'Product B',
          brand: 'Brand B',
          category: 'Cat',
          dimensions: { width: 10, height: 10 },
        },
        timestamp: new Date().toISOString(),
        status: 'valid',
      },
      {
        id: 'bid-3',
        agentId: 'agent-3',
        amount: 50,
        productDetails: {
          name: 'Product C',
          brand: 'Brand C',
          category: 'Cat',
          dimensions: { width: 10, height: 10 },
        },
        timestamp: new Date().toISOString(),
        status: 'valid',
      },
    ]);

    mockGet.mockResolvedValueOnce(auction);
    mockUpdate.mockImplementation(
      (id: unknown, updates: unknown) =>
        Promise.resolve({ ...auction, ...(updates as Partial<Auction>) })
    );

    const result = await selectWinner('auction-1');

    expect(result.winnerId).toBe('agent-2');
    expect(result.winningBid).toBe(75);
    expect(result.status).toBe('completed');
  });

  it('should cancel auction when no bids exist', async () => {
    const auction = createActiveAuction([]);

    mockGet.mockResolvedValueOnce(auction);
    mockUpdate.mockImplementation(
      (id: unknown, updates: unknown) =>
        Promise.resolve({ ...auction, ...(updates as Partial<Auction>) })
    );

    const result = await selectWinner('auction-1');

    expect(result.status).toBe('cancelled');
  });

  it('should ignore invalid bids when selecting winner', async () => {
    const auction = createActiveAuction([
      {
        id: 'bid-1',
        agentId: 'agent-1',
        amount: 100,
        productDetails: {
          name: 'Product A',
          brand: 'Brand A',
          category: 'Cat',
          dimensions: { width: 10, height: 10 },
        },
        timestamp: new Date().toISOString(),
        status: 'invalid', // This bid is invalid
      },
      {
        id: 'bid-2',
        agentId: 'agent-2',
        amount: 50,
        productDetails: {
          name: 'Product B',
          brand: 'Brand B',
          category: 'Cat',
          dimensions: { width: 10, height: 10 },
        },
        timestamp: new Date().toISOString(),
        status: 'valid',
      },
    ]);

    mockGet.mockResolvedValueOnce(auction);
    mockUpdate.mockImplementation(
      (id: unknown, updates: unknown) =>
        Promise.resolve({ ...auction, ...(updates as Partial<Auction>) })
    );

    const result = await selectWinner('auction-1');

    expect(result.winnerId).toBe('agent-2');
    expect(result.winningBid).toBe(50);
  });

  it('should throw error for non-active auction', async () => {
    const auction = createActiveAuction();
    auction.status = 'completed' as AuctionStatus;

    mockGet.mockResolvedValueOnce(auction);

    await expect(selectWinner('auction-1')).rejects.toThrow(
      BidValidationError
    );
  });
});

describe('cancelAuction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set auction status to cancelled', async () => {
    const auction = createActiveAuction();
    mockUpdate.mockImplementation(
      (id: unknown, updates: unknown) =>
        Promise.resolve({ ...auction, ...(updates as Partial<Auction>) })
    );

    const result = await cancelAuction('auction-1', 'Test cancellation');

    expect(result.status).toBe('cancelled');
    expect(mockUpdate).toHaveBeenCalledWith('auction-1', {
      status: 'cancelled',
    });
  });
});

describe('getActiveAuctions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return active auctions', async () => {
    const activeAuctions = [createActiveAuction()];
    mockQueryByStatus.mockResolvedValueOnce({
      items: activeAuctions,
      count: 1,
    });

    const result = await getActiveAuctions();

    expect(result).toHaveLength(1);
    expect(mockQueryByStatus).toHaveBeenCalledWith('active');
  });

  it('should return empty array when no active auctions', async () => {
    mockQueryByStatus.mockResolvedValueOnce({
      items: [],
      count: 0,
    });

    const result = await getActiveAuctions();

    expect(result).toHaveLength(0);
  });
});
