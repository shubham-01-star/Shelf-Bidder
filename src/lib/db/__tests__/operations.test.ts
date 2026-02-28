/**
 * Unit tests for DynamoDB operations
 * Tests CRUD operations with mocked DynamoDB client
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type {
  Shopkeeper,
  ShelfSpace,
  Auction,
  Task,
  WalletTransaction,
} from '@/types/models';

// Mock the DynamoDB client before importing operations
const mockSend = jest.fn<(...args: any[]) => any>();
jest.mock('../client', () => ({
  dynamoDBClient: {
    send: mockSend,
  },
}));

import {
  ShopkeeperOperations,
  ShelfSpaceOperations,
  AuctionOperations,
  TaskOperations,
  WalletTransactionOperations,
} from '../operations';
import { ItemNotFoundError } from '../errors';

describe('ShopkeeperOperations', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  const mockShopkeeper: Shopkeeper = {
    id: 'shop-123',
    name: 'Ramesh Kumar',
    phoneNumber: '+919876543210',
    storeAddress: '123 Main Street, Mumbai',
    preferredLanguage: 'hi',
    timezone: 'Asia/Kolkata',
    walletBalance: 100.5,
    registrationDate: '2024-01-01T00:00:00.000Z',
    lastActiveDate: '2024-01-15T10:30:00.000Z',
  };

  describe('create', () => {
    it('should create a new shopkeeper', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await ShopkeeperOperations.create(mockShopkeeper);

      expect(result).toEqual(mockShopkeeper);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle creation errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(ShopkeeperOperations.create(mockShopkeeper)).rejects.toThrow();
    });
  });

  describe('get', () => {
    it('should retrieve a shopkeeper by ID', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          PK: 'SHOPKEEPER#shop-123',
          SK: 'METADATA',
          EntityType: 'SHOPKEEPER',
          ShopkeeperId: 'shop-123',
          Name: 'Ramesh Kumar',
          PhoneNumber: '+919876543210',
          StoreAddress: '123 Main Street, Mumbai',
          PreferredLanguage: 'hi',
          Timezone: 'Asia/Kolkata',
          WalletBalance: 100.5,
          RegistrationDate: '2024-01-01T00:00:00.000Z',
          LastActiveDate: '2024-01-15T10:30:00.000Z',
          CreatedAt: '2024-01-01T00:00:00.000Z',
          UpdatedAt: '2024-01-01T00:00:00.000Z',
        },
      });

      const result = await ShopkeeperOperations.get('shop-123');

      expect(result.id).toBe('shop-123');
      expect(result.name).toBe('Ramesh Kumar');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw ItemNotFoundError when shopkeeper does not exist', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      await expect(ShopkeeperOperations.get('nonexistent')).rejects.toThrow(
        ItemNotFoundError
      );
    });
  });

  describe('update', () => {
    it('should update shopkeeper fields', async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: {
          PK: 'SHOPKEEPER#shop-123',
          SK: 'METADATA',
          EntityType: 'SHOPKEEPER',
          ShopkeeperId: 'shop-123',
          Name: 'Ramesh Kumar Updated',
          PhoneNumber: '+919876543210',
          StoreAddress: '123 Main Street, Mumbai',
          PreferredLanguage: 'hi',
          Timezone: 'Asia/Kolkata',
          WalletBalance: 200.0,
          RegistrationDate: '2024-01-01T00:00:00.000Z',
          LastActiveDate: '2024-01-16T10:30:00.000Z',
          CreatedAt: '2024-01-01T00:00:00.000Z',
          UpdatedAt: '2024-01-16T10:30:00.000Z',
        },
      });

      const result = await ShopkeeperOperations.update('shop-123', {
        name: 'Ramesh Kumar Updated',
        walletBalance: 200.0,
      });

      expect(result.name).toBe('Ramesh Kumar Updated');
      expect(result.walletBalance).toBe(200.0);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should delete a shopkeeper', async () => {
      mockSend.mockResolvedValueOnce({});

      await ShopkeeperOperations.delete('shop-123');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});

describe('ShelfSpaceOperations', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  const mockShelfSpace: ShelfSpace = {
    id: 'shelf-456',
    shopkeeperId: 'shop-123',
    photoUrl: 'https://example.com/photo.jpg',
    analysisDate: '2024-01-15T10:00:00.000Z',
    emptySpaces: [
      {
        id: 'empty-789',
        coordinates: { x: 100, y: 200, width: 300, height: 150 },
        shelfLevel: 2,
        visibility: 'high',
        accessibility: 'easy',
      },
    ],
    currentInventory: [
      {
        name: 'Coca Cola',
        brand: 'Coca Cola Company',
        category: 'Beverages',
      },
    ],
    analysisConfidence: 95.5,
  };

  describe('create', () => {
    it('should create a new shelf space', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await ShelfSpaceOperations.create(mockShelfSpace);

      expect(result).toEqual(mockShelfSpace);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('queryByShopkeeper', () => {
    it('should query shelf spaces by shopkeeper', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            PK: 'SHOPKEEPER#shop-123',
            SK: 'SHELFSPACE#2024-01-15T10:00:00.000Z#shelf-456',
            GSI1PK: 'SHELFSPACE#shelf-456',
            GSI1SK: 'METADATA',
            EntityType: 'SHELFSPACE',
            ShelfSpaceId: 'shelf-456',
            ShopkeeperId: 'shop-123',
            PhotoUrl: 'https://example.com/photo.jpg',
            AnalysisDate: '2024-01-15T10:00:00.000Z',
            EmptySpaces: JSON.stringify(mockShelfSpace.emptySpaces),
            CurrentInventory: JSON.stringify(mockShelfSpace.currentInventory),
            AnalysisConfidence: 95.5,
            CreatedAt: '2024-01-15T10:00:00.000Z',
            UpdatedAt: '2024-01-15T10:00:00.000Z',
          },
        ],
        Count: 1,
      });

      const result = await ShelfSpaceOperations.queryByShopkeeper('shop-123');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('shelf-456');
      expect(result.count).toBe(1);
    });

    it('should query with date range', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
        Count: 0,
      });

      const result = await ShelfSpaceOperations.queryByShopkeeper(
        'shop-123',
        '2024-01-01T00:00:00.000Z',
        '2024-01-31T23:59:59.999Z'
      );

      expect(result.items).toHaveLength(0);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});

describe('AuctionOperations', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  const mockAuction: Auction = {
    id: 'auction-111',
    shelfSpaceId: 'shelf-456',
    startTime: '2024-01-15T10:00:00.000Z',
    endTime: '2024-01-15T10:15:00.000Z',
    status: 'active',
    bids: [],
  };

  describe('create', () => {
    it('should create a new auction', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await AuctionOperations.create(mockAuction);

      expect(result).toEqual(mockAuction);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('queryByStatus', () => {
    it('should query active auctions', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            PK: 'AUCTION#auction-111',
            SK: 'METADATA',
            GSI1PK: 'SHELFSPACE#shelf-456',
            GSI1SK: 'AUCTION#2024-01-15T10:00:00.000Z',
            GSI2PK: 'STATUS#active',
            GSI2SK: 'AUCTION#2024-01-15T10:00:00.000Z',
            EntityType: 'AUCTION',
            AuctionId: 'auction-111',
            ShelfSpaceId: 'shelf-456',
            StartTime: '2024-01-15T10:00:00.000Z',
            EndTime: '2024-01-15T10:15:00.000Z',
            Status: 'active',
            Bids: '[]',
            CreatedAt: '2024-01-15T10:00:00.000Z',
            UpdatedAt: '2024-01-15T10:00:00.000Z',
          },
        ],
        Count: 1,
      });

      const result = await AuctionOperations.queryByStatus('active');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('active');
    });
  });

  describe('update', () => {
    it('should update auction status', async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: {
          PK: 'AUCTION#auction-111',
          SK: 'METADATA',
          GSI1PK: 'SHELFSPACE#shelf-456',
          GSI1SK: 'AUCTION#2024-01-15T10:00:00.000Z',
          GSI2PK: 'STATUS#completed',
          GSI2SK: 'AUCTION#2024-01-15T10:00:00.000Z',
          EntityType: 'AUCTION',
          AuctionId: 'auction-111',
          ShelfSpaceId: 'shelf-456',
          StartTime: '2024-01-15T10:00:00.000Z',
          EndTime: '2024-01-15T10:15:00.000Z',
          Status: 'completed',
          Bids: '[]',
          WinnerId: 'agent-555',
          WinningBid: 50.0,
          CreatedAt: '2024-01-15T10:00:00.000Z',
          UpdatedAt: '2024-01-15T10:15:00.000Z',
        },
      });

      const result = await AuctionOperations.update('auction-111', {
        status: 'completed',
        winnerId: 'agent-555',
        winningBid: 50.0,
      });

      expect(result.status).toBe('completed');
      expect(result.winnerId).toBe('agent-555');
    });
  });
});

describe('TaskOperations', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  const mockTask: Task = {
    id: 'task-777',
    auctionId: 'auction-111',
    shopkeeperId: 'shop-123',
    instructions: {
      productName: 'Pepsi 500ml',
      brandName: 'PepsiCo',
      targetLocation: {
        id: 'empty-789',
        coordinates: { x: 100, y: 200, width: 300, height: 150 },
        shelfLevel: 2,
        visibility: 'high',
        accessibility: 'easy',
      },
      positioningRules: ['Place at eye level'],
      visualRequirements: ['Must be visible'],
      timeLimit: 24,
    },
    status: 'assigned',
    assignedDate: '2024-01-15T10:00:00.000Z',
    earnings: 50.0,
  };

  describe('create', () => {
    it('should create a new task', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await TaskOperations.create(mockTask);

      expect(result).toEqual(mockTask);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('queryByShopkeeper', () => {
    it('should query tasks by shopkeeper', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            PK: 'SHOPKEEPER#shop-123',
            SK: 'TASK#2024-01-15T10:00:00.000Z#task-777',
            GSI1PK: 'TASK#task-777',
            GSI1SK: 'METADATA',
            GSI2PK: 'STATUS#assigned',
            GSI2SK: 'TASK#2024-01-15T10:00:00.000Z',
            EntityType: 'TASK',
            TaskId: 'task-777',
            AuctionId: 'auction-111',
            ShopkeeperId: 'shop-123',
            Instructions: JSON.stringify(mockTask.instructions),
            Status: 'assigned',
            AssignedDate: '2024-01-15T10:00:00.000Z',
            Earnings: 50.0,
            CreatedAt: '2024-01-15T10:00:00.000Z',
            UpdatedAt: '2024-01-15T10:00:00.000Z',
          },
        ],
        Count: 1,
      });

      const result = await TaskOperations.queryByShopkeeper('shop-123');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('task-777');
    });
  });
});

describe('WalletTransactionOperations', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  const mockTransaction: WalletTransaction = {
    id: 'txn-999',
    shopkeeperId: 'shop-123',
    type: 'earning',
    amount: 50.0,
    description: 'Task completion payment',
    taskId: 'task-777',
    timestamp: '2024-01-15T10:30:00.000Z',
    status: 'completed',
  };

  describe('create', () => {
    it('should create a new transaction', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await WalletTransactionOperations.create(mockTransaction);

      expect(result).toEqual(mockTransaction);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('queryByShopkeeper', () => {
    it('should query transactions by shopkeeper', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            PK: 'SHOPKEEPER#shop-123',
            SK: 'TRANSACTION#2024-01-15T10:30:00.000Z#txn-999',
            GSI1PK: 'TRANSACTION#txn-999',
            GSI1SK: 'METADATA',
            EntityType: 'TRANSACTION',
            TransactionId: 'txn-999',
            ShopkeeperId: 'shop-123',
            Type: 'earning',
            Amount: 50.0,
            Description: 'Task completion payment',
            TaskId: 'task-777',
            Timestamp: '2024-01-15T10:30:00.000Z',
            Status: 'completed',
            CreatedAt: '2024-01-15T10:30:00.000Z',
            UpdatedAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        Count: 1,
      });

      const result = await WalletTransactionOperations.queryByShopkeeper('shop-123');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].amount).toBe(50.0);
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status', async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: {
          PK: 'SHOPKEEPER#shop-123',
          SK: 'TRANSACTION#2024-01-15T10:30:00.000Z#txn-999',
          GSI1PK: 'TRANSACTION#txn-999',
          GSI1SK: 'METADATA',
          EntityType: 'TRANSACTION',
          TransactionId: 'txn-999',
          ShopkeeperId: 'shop-123',
          Type: 'earning',
          Amount: 50.0,
          Description: 'Task completion payment',
          TaskId: 'task-777',
          Timestamp: '2024-01-15T10:30:00.000Z',
          Status: 'failed',
          CreatedAt: '2024-01-15T10:30:00.000Z',
          UpdatedAt: '2024-01-15T10:31:00.000Z',
        },
      });

      const result = await WalletTransactionOperations.updateStatus(
        'txn-999',
        'shop-123',
        '2024-01-15T10:30:00.000Z',
        'failed'
      );

      expect(result.status).toBe('failed');
    });
  });
});
