/**
 * Unit tests for DynamoDB entity mappers
 */

import { describe, it, expect } from '@jest/globals';
import type {
  Shopkeeper,
  ShelfSpace,
  Auction,
  Task,
  WalletTransaction,
} from '@/types/models';
import {
  ShopkeeperMapper,
  ShelfSpaceMapper,
  AuctionMapper,
  TaskMapper,
  WalletTransactionMapper,
} from '../mappers';

describe('ShopkeeperMapper', () => {
  const mockShopkeeper: Shopkeeper = {
    id: '123e4567-e89b-41d4-a456-426614174000',
    name: 'Ramesh Kumar',
    phoneNumber: '+919876543210',
    storeAddress: '123 Main Street, Mumbai',
    preferredLanguage: 'hi',
    timezone: 'Asia/Kolkata',
    walletBalance: 100.5,
    registrationDate: '2024-01-01T00:00:00.000Z',
    lastActiveDate: '2024-01-15T10:30:00.000Z',
  };

  it('should convert Shopkeeper to DynamoDB item', () => {
    const item = ShopkeeperMapper.toItem(mockShopkeeper);

    expect(item.PK).toBe('SHOPKEEPER#123e4567-e89b-41d4-a456-426614174000');
    expect(item.SK).toBe('METADATA');
    expect(item.EntityType).toBe('SHOPKEEPER');
    expect(item.shopkeeperId).toBe(mockShopkeeper.id);
    expect(item.Name).toBe(mockShopkeeper.name);
    expect(item.WalletBalance).toBe(mockShopkeeper.walletBalance);
  });

  it('should convert DynamoDB item back to Shopkeeper', () => {
    const item = ShopkeeperMapper.toItem(mockShopkeeper);
    const shopkeeper = ShopkeeperMapper.fromItem(item);

    expect(shopkeeper).toEqual(mockShopkeeper);
  });
});

describe('ShelfSpaceMapper', () => {
  const mockShelfSpace: ShelfSpace = {
    id: '456e7890-e89b-41d4-a456-426614174001',
    shopkeeperId: '123e4567-e89b-41d4-a456-426614174000',
    photoUrl: 'https://example.com/photo.jpg',
    analysisDate: '2024-01-15',
    emptySpaces: [
      {
        id: '789e0123-e89b-41d4-a456-426614174002',
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

  it('should convert ShelfSpace to DynamoDB item', () => {
    const item = ShelfSpaceMapper.toItem(mockShelfSpace);

    expect(item.PK).toBe('SHOPKEEPER#123e4567-e89b-41d4-a456-426614174000');
    expect(item.SK).toContain('SHELFSPACE#2024-01-15#');
    expect(item.GSI1PK).toBe('SHELFSPACE#456e7890-e89b-41d4-a456-426614174001');
    expect(item.EntityType).toBe('SHELFSPACE');
    expect(item.AnalysisConfidence).toBe(95.5);
    expect(typeof item.EmptySpaces).toBe('string');
    expect(typeof item.CurrentInventory).toBe('string');
  });

  it('should convert DynamoDB item back to ShelfSpace', () => {
    const item = ShelfSpaceMapper.toItem(mockShelfSpace);
    const shelfSpace = ShelfSpaceMapper.fromItem(item);

    expect(shelfSpace).toEqual(mockShelfSpace);
    expect(shelfSpace.emptySpaces).toHaveLength(1);
    expect(shelfSpace.currentInventory).toHaveLength(1);
  });
});

describe('AuctionMapper', () => {
  const mockAuction: Auction = {
    id: '111e2222-e89b-41d4-a456-426614174003',
    shelfSpaceId: '456e7890-e89b-41d4-a456-426614174001',
    startTime: '2024-01-15T10:00:00.000Z',
    endTime: '2024-01-15T10:15:00.000Z',
    status: 'active',
    bids: [
      {
        id: '333e4444-e89b-41d4-a456-426614174004',
        agentId: '555e6666-e89b-41d4-a456-426614174005',
        amount: 50.0,
        productDetails: {
          name: 'Pepsi 500ml',
          brand: 'PepsiCo',
          category: 'Beverages',
          dimensions: { width: 6.5, height: 20.0, depth: 6.5 },
        },
        timestamp: '2024-01-15T10:05:00.000Z',
        status: 'valid',
      },
    ],
    winnerId: '555e6666-e89b-41d4-a456-426614174005',
    winningBid: 50.0,
  };

  it('should convert Auction to DynamoDB item', () => {
    const item = AuctionMapper.toItem(mockAuction);

    expect(item.PK).toBe('AUCTION#111e2222-e89b-41d4-a456-426614174003');
    expect(item.SK).toBe('METADATA');
    expect(item.GSI1PK).toBe('SHELFSPACE#456e7890-e89b-41d4-a456-426614174001');
    expect(item.GSI2PK).toBe('STATUS#active');
    expect(item.EntityType).toBe('AUCTION');
    expect(item.Status).toBe('active');
    expect(typeof item.Bids).toBe('string');
  });

  it('should convert DynamoDB item back to Auction', () => {
    const item = AuctionMapper.toItem(mockAuction);
    const auction = AuctionMapper.fromItem(item);

    expect(auction).toEqual(mockAuction);
    expect(auction.bids).toHaveLength(1);
    expect(auction.winnerId).toBe('555e6666-e89b-41d4-a456-426614174005');
  });
});

describe('TaskMapper', () => {
  const mockTask: Task = {
    id: '777e8888-e89b-41d4-a456-426614174006',
    auctionId: '111e2222-e89b-41d4-a456-426614174003',
    shopkeeperId: '123e4567-e89b-41d4-a456-426614174000',
    instructions: {
      productName: 'Pepsi 500ml',
      brandName: 'PepsiCo',
      targetLocation: {
        id: '789e0123-e89b-41d4-a456-426614174002',
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
    assignedDate: '2024-01-15',
    earnings: 50.0,
  };

  it('should convert Task to DynamoDB item', () => {
    const item = TaskMapper.toItem(mockTask);

    expect(item.PK).toBe('SHOPKEEPER#123e4567-e89b-41d4-a456-426614174000');
    expect(item.SK).toContain('TASK#2024-01-15#');
    expect(item.GSI1PK).toBe('TASK#777e8888-e89b-41d4-a456-426614174006');
    expect(item.GSI2PK).toBe('STATUS#assigned');
    expect(item.EntityType).toBe('TASK');
    expect(typeof item.Instructions).toBe('string');
  });

  it('should convert DynamoDB item back to Task', () => {
    const item = TaskMapper.toItem(mockTask);
    const task = TaskMapper.fromItem(item);

    expect(task).toEqual(mockTask);
    expect(task.instructions.positioningRules).toHaveLength(1);
  });
});

describe('WalletTransactionMapper', () => {
  const mockTransaction: WalletTransaction = {
    id: '999e0000-e89b-41d4-a456-426614174007',
    shopkeeperId: '123e4567-e89b-41d4-a456-426614174000',
    type: 'earning',
    amount: 50.0,
    description: 'Task completion payment',
    taskId: '777e8888-e89b-41d4-a456-426614174006',
    timestamp: '2024-01-15T10:30:00.000Z',
    status: 'completed',
  };

  it('should convert WalletTransaction to DynamoDB item', () => {
    const item = WalletTransactionMapper.toItem(mockTransaction);

    expect(item.PK).toBe('SHOPKEEPER#123e4567-e89b-41d4-a456-426614174000');
    expect(item.SK).toContain('TRANSACTION#2024-01-15T10:30:00.000Z#');
    expect(item.GSI1PK).toBe('TRANSACTION#999e0000-e89b-41d4-a456-426614174007');
    expect(item.EntityType).toBe('TRANSACTION');
    expect(item.Amount).toBe(50.0);
  });

  it('should convert DynamoDB item back to WalletTransaction', () => {
    const item = WalletTransactionMapper.toItem(mockTransaction);
    const transaction = WalletTransactionMapper.fromItem(item);

    expect(transaction).toEqual(mockTransaction);
  });
});
