/**
 * Unit tests for Task Assignment Service
 * Task 10.1: Task assignment system
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Auction, Task } from '@/types/models';

// ============================================================================
// Mocks
// ============================================================================

const mockTaskCreate = jest.fn();
const mockTaskUpdate = jest.fn();
const mockTaskQueryByStatus = jest.fn();
const mockAuctionGet = jest.fn();
const mockShelfSpaceGet = jest.fn();

jest.mock('@/lib/db', () => ({
  TaskOperations: {
    create: (...args: unknown[]) => mockTaskCreate(...args),
    update: (...args: unknown[]) => mockTaskUpdate(...args),
    queryByStatus: (...args: unknown[]) => mockTaskQueryByStatus(...args),
  },
  AuctionOperations: {
    get: (...args: unknown[]) => mockAuctionGet(...args),
  },
  ShelfSpaceOperations: {
    get: (...args: unknown[]) => mockShelfSpaceGet(...args),
  },
}));

jest.mock('uuid', () => ({
  v4: () => 'mock-task-uuid',
}));

import {
  createTaskFromAuction,
  startTask,
  completeTask,
  failTask,
  getPendingTasks,
  checkOverdueTasks,
  TaskAssignmentError,
} from '../task-assignment';

// ============================================================================
// Test Data
// ============================================================================

const createCompletedAuction = (): Auction => ({
  id: 'auction-1',
  shelfSpaceId: 'shelf-1',
  startTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  status: 'completed',
  bids: [
    {
      id: 'bid-1',
      agentId: 'agent-1',
      amount: 50,
      productDetails: {
        name: 'Pepsi 500ml',
        brand: 'PepsiCo',
        category: 'Beverages',
        dimensions: { width: 80, height: 120 },
      },
      timestamp: new Date().toISOString(),
      status: 'valid',
    },
    {
      id: 'bid-2',
      agentId: 'agent-2',
      amount: 75,
      productDetails: {
        name: 'Coca-Cola 500ml',
        brand: 'Coca-Cola',
        category: 'Beverages',
        dimensions: { width: 80, height: 120 },
      },
      timestamp: new Date().toISOString(),
      status: 'valid',
    },
  ],
  winnerId: 'agent-2',
  winningBid: 75,
});

// ============================================================================
// Tests
// ============================================================================

describe('createTaskFromAuction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create task from completed auction', async () => {
    const auction = createCompletedAuction();
    mockAuctionGet.mockResolvedValueOnce(auction);
    mockShelfSpaceGet.mockRejectedValueOnce(new Error('Not found'));
    mockTaskCreate.mockImplementation((task: Task) => Promise.resolve(task));

    const result = await createTaskFromAuction('auction-1', 'shop-123');

    expect(result.auctionId).toBe('auction-1');
    expect(result.shopkeeperId).toBe('shop-123');
    expect(result.status).toBe('assigned');
    expect(result.earnings).toBe(75);
    expect(result.instructions.productName).toBe('Coca-Cola 500ml');
    expect(result.instructions.brandName).toBe('Coca-Cola');
    expect(mockTaskCreate).toHaveBeenCalledTimes(1);
  });

  it('should reject for non-completed auction', async () => {
    mockAuctionGet.mockResolvedValueOnce({
      ...createCompletedAuction(),
      status: 'active',
    });

    await expect(
      createTaskFromAuction('auction-1', 'shop-123')
    ).rejects.toThrow(TaskAssignmentError);
  });

  it('should reject for auction without winner', async () => {
    mockAuctionGet.mockResolvedValueOnce({
      ...createCompletedAuction(),
      winnerId: undefined,
      winningBid: undefined,
    });

    await expect(
      createTaskFromAuction('auction-1', 'shop-123')
    ).rejects.toThrow('no winner');
  });

  it('should include correct placement instructions', async () => {
    const auction = createCompletedAuction();
    mockAuctionGet.mockResolvedValueOnce(auction);
    mockShelfSpaceGet.mockRejectedValueOnce(new Error('Not found'));
    mockTaskCreate.mockImplementation((task: Task) => Promise.resolve(task));

    const result = await createTaskFromAuction('auction-1', 'shop-123');

    expect(result.instructions.positioningRules.length).toBeGreaterThan(0);
    expect(result.instructions.visualRequirements.length).toBeGreaterThan(0);
    expect(result.instructions.timeLimit).toBe(24);
  });
});

describe('startTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update task status to in_progress', async () => {
    const mockTask: Task = {
      id: 'task-1', auctionId: 'auction-1', shopkeeperId: 'shop-123',
      instructions: {} as any, status: 'in_progress',
      assignedDate: '2024-01-15T10:00:00.000Z', earnings: 50,
    };
    mockTaskUpdate.mockResolvedValueOnce(mockTask);

    const result = await startTask('task-1', 'shop-123', '2024-01-15T10:00:00.000Z');

    expect(result.status).toBe('in_progress');
    expect(mockTaskUpdate).toHaveBeenCalledWith(
      'task-1', 'shop-123', '2024-01-15T10:00:00.000Z',
      { status: 'in_progress' }
    );
  });
});

describe('completeTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update task with proof photo and completed status', async () => {
    const mockTask: Task = {
      id: 'task-1', auctionId: 'auction-1', shopkeeperId: 'shop-123',
      instructions: {} as any, status: 'completed',
      assignedDate: '2024-01-15T10:00:00.000Z', earnings: 50,
      proofPhotoUrl: 'https://s3.com/proof.jpg',
    };
    mockTaskUpdate.mockResolvedValueOnce(mockTask);

    const result = await completeTask(
      'task-1', 'shop-123', '2024-01-15T10:00:00.000Z', 'https://s3.com/proof.jpg'
    );

    expect(result.status).toBe('completed');
    expect(result.proofPhotoUrl).toBe('https://s3.com/proof.jpg');
  });
});

describe('failTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update task status to failed', async () => {
    const mockTask: Task = {
      id: 'task-1', auctionId: 'auction-1', shopkeeperId: 'shop-123',
      instructions: {} as any, status: 'failed',
      assignedDate: '2024-01-15T10:00:00.000Z', earnings: 50,
    };
    mockTaskUpdate.mockResolvedValueOnce(mockTask);

    const result = await failTask('task-1', 'shop-123', '2024-01-15T10:00:00.000Z');

    expect(result.status).toBe('failed');
  });
});

describe('getPendingTasks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return assigned and in-progress tasks for shopkeeper', async () => {
    mockTaskQueryByStatus
      .mockResolvedValueOnce({
        items: [
          { id: 'task-1', shopkeeperId: 'shop-123', status: 'assigned' },
          { id: 'task-2', shopkeeperId: 'shop-999', status: 'assigned' },
        ],
        count: 2,
      })
      .mockResolvedValueOnce({
        items: [
          { id: 'task-3', shopkeeperId: 'shop-123', status: 'in_progress' },
        ],
        count: 1,
      });

    const result = await getPendingTasks('shop-123');

    expect(result).toHaveLength(2); // task-1 and task-3 (shop-123 only)
    expect(result.map((t) => t.id)).toContain('task-1');
    expect(result.map((t) => t.id)).toContain('task-3');
  });
});

describe('checkOverdueTasks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should mark overdue tasks as failed', async () => {
    const oldDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(); // 72 hours ago
    const recentDate = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(); // 12 hours ago

    mockTaskQueryByStatus
      .mockResolvedValueOnce({
        items: [
          { id: 'task-old', shopkeeperId: 'shop-1', assignedDate: oldDate, status: 'assigned' },
          { id: 'task-recent', shopkeeperId: 'shop-2', assignedDate: recentDate, status: 'assigned' },
        ],
        count: 2,
      })
      .mockResolvedValueOnce({ items: [], count: 0 });

    mockTaskUpdate.mockImplementation(
      (id: string, _shopkeeperId: string, _date: string, updates: Partial<Task>) =>
        Promise.resolve({ id, ...updates, status: 'failed' })
    );

    const result = await checkOverdueTasks();

    // Only the old task (72h > 48h threshold) should be marked as failed
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('task-old');
    expect(mockTaskUpdate).toHaveBeenCalledTimes(1);
  });
});
