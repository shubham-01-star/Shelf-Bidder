/**
 * Unit tests for Zod validation schemas
 */

import { describe, it, expect } from '@jest/globals';
import {
  ShopkeeperSchema,
  ShelfSpaceSchema,
  AuctionSchema,
  TaskSchema,
  WalletTransactionSchema,
  validate,
  safeValidate,
} from '../schemas';

describe('ShopkeeperSchema', () => {
  const validShopkeeper = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Ramesh Kumar',
    phoneNumber: '+919876543210',
    storeAddress: '123 Main Street, Mumbai',
    preferredLanguage: 'hi',
    timezone: 'Asia/Kolkata',
    walletBalance: 100.5,
    registrationDate: '2024-01-01T00:00:00.000Z',
    lastActiveDate: '2024-01-15T10:30:00.000Z',
  };

  it('should validate a valid shopkeeper', () => {
    expect(() => validate(ShopkeeperSchema, validShopkeeper)).not.toThrow();
  });

  it('should reject invalid UUID', () => {
    const invalid = { ...validShopkeeper, id: 'not-a-uuid' };
    expect(() => validate(ShopkeeperSchema, invalid)).toThrow();
  });

  it('should reject negative wallet balance', () => {
    const invalid = { ...validShopkeeper, walletBalance: -10 };
    expect(() => validate(ShopkeeperSchema, invalid)).toThrow();
  });

  it('should reject invalid phone number', () => {
    const invalid = { ...validShopkeeper, phoneNumber: 'invalid' };
    expect(() => validate(ShopkeeperSchema, invalid)).toThrow();
  });

  it('should work with safeValidate', () => {
    const result = safeValidate(ShopkeeperSchema, validShopkeeper);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Ramesh Kumar');
    }
  });
});

describe('ShelfSpaceSchema', () => {
  const validShelfSpace = {
    id: '456e7890-e89b-12d3-a456-426614174001',
    shopkeeperId: '123e4567-e89b-12d3-a456-426614174000',
    photoUrl: 'https://example.com/photo.jpg',
    analysisDate: '2024-01-15T10:00:00.000Z',
    emptySpaces: [
      {
        id: '789e0123-e89b-12d3-a456-426614174002',
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

  it('should validate a valid shelf space', () => {
    expect(() => validate(ShelfSpaceSchema, validShelfSpace)).not.toThrow();
  });

  it('should reject invalid URL', () => {
    const invalid = { ...validShelfSpace, photoUrl: 'not-a-url' };
    expect(() => validate(ShelfSpaceSchema, invalid)).toThrow();
  });

  it('should reject confidence outside 0-100 range', () => {
    const invalid = { ...validShelfSpace, analysisConfidence: 150 };
    expect(() => validate(ShelfSpaceSchema, invalid)).toThrow();
  });

  it('should reject invalid visibility value', () => {
    const invalid = {
      ...validShelfSpace,
      emptySpaces: [
        {
          ...validShelfSpace.emptySpaces[0],
          visibility: 'invalid' as any,
        },
      ],
    };
    expect(() => validate(ShelfSpaceSchema, invalid)).toThrow();
  });

  it('should reject negative coordinates', () => {
    const invalid = {
      ...validShelfSpace,
      emptySpaces: [
        {
          ...validShelfSpace.emptySpaces[0],
          coordinates: { x: -10, y: 200, width: 300, height: 150 },
        },
      ],
    };
    expect(() => validate(ShelfSpaceSchema, invalid)).toThrow();
  });
});

describe('AuctionSchema', () => {
  const validAuction = {
    id: '111e2222-e89b-12d3-a456-426614174003',
    shelfSpaceId: '456e7890-e89b-12d3-a456-426614174001',
    startTime: '2024-01-15T10:00:00.000Z',
    endTime: '2024-01-15T10:15:00.000Z',
    status: 'active',
    bids: [
      {
        id: '333e4444-e89b-12d3-a456-426614174004',
        agentId: '555e6666-e89b-12d3-a456-426614174005',
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
    winnerId: '555e6666-e89b-12d3-a456-426614174005',
    winningBid: 50.0,
  };

  it('should validate a valid auction', () => {
    expect(() => validate(AuctionSchema, validAuction)).not.toThrow();
  });

  it('should reject invalid status', () => {
    const invalid = { ...validAuction, status: 'invalid' };
    expect(() => validate(AuctionSchema, invalid)).toThrow();
  });

  it('should reject negative bid amount', () => {
    const invalid = {
      ...validAuction,
      bids: [{ ...validAuction.bids[0], amount: -10 }],
    };
    expect(() => validate(AuctionSchema, invalid)).toThrow();
  });

  it('should allow auction without winner', () => {
    const { winnerId, winningBid, ...auctionWithoutWinner } = validAuction;
    expect(() => validate(AuctionSchema, auctionWithoutWinner)).not.toThrow();
  });
});

describe('TaskSchema', () => {
  const validTask = {
    id: '777e8888-e89b-12d3-a456-426614174006',
    auctionId: '111e2222-e89b-12d3-a456-426614174003',
    shopkeeperId: '123e4567-e89b-12d3-a456-426614174000',
    instructions: {
      productName: 'Pepsi 500ml',
      brandName: 'PepsiCo',
      targetLocation: {
        id: '789e0123-e89b-12d3-a456-426614174002',
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

  it('should validate a valid task', () => {
    expect(() => validate(TaskSchema, validTask)).not.toThrow();
  });

  it('should reject invalid status', () => {
    const invalid = { ...validTask, status: 'invalid' };
    expect(() => validate(TaskSchema, invalid)).toThrow();
  });

  it('should reject negative earnings', () => {
    const invalid = { ...validTask, earnings: -10 };
    expect(() => validate(TaskSchema, invalid)).toThrow();
  });

  it('should reject invalid time limit', () => {
    const invalid = {
      ...validTask,
      instructions: { ...validTask.instructions, timeLimit: 0 },
    };
    expect(() => validate(TaskSchema, invalid)).toThrow();
  });

  it('should allow task without completion data', () => {
    expect(() => validate(TaskSchema, validTask)).not.toThrow();
  });

  it('should validate task with completion data', () => {
    const completed = {
      ...validTask,
      status: 'completed',
      completedDate: '2024-01-15T12:00:00.000Z',
      proofPhotoUrl: 'https://example.com/proof.jpg',
      verificationResult: {
        verified: true,
        feedback: 'Perfect placement',
        confidence: 98.5,
      },
    };
    expect(() => validate(TaskSchema, completed)).not.toThrow();
  });
});

describe('WalletTransactionSchema', () => {
  const validTransaction = {
    id: '999e0000-e89b-12d3-a456-426614174007',
    shopkeeperId: '123e4567-e89b-12d3-a456-426614174000',
    type: 'earning',
    amount: 50.0,
    description: 'Task completion payment',
    taskId: '777e8888-e89b-12d3-a456-426614174006',
    timestamp: '2024-01-15T10:30:00.000Z',
    status: 'completed',
  };

  it('should validate a valid transaction', () => {
    expect(() => validate(WalletTransactionSchema, validTransaction)).not.toThrow();
  });

  it('should reject invalid type', () => {
    const invalid = { ...validTransaction, type: 'invalid' };
    expect(() => validate(WalletTransactionSchema, invalid)).toThrow();
  });

  it('should reject invalid status', () => {
    const invalid = { ...validTransaction, status: 'invalid' };
    expect(() => validate(WalletTransactionSchema, invalid)).toThrow();
  });

  it('should allow negative amount for adjustments', () => {
    const adjustment = { ...validTransaction, type: 'adjustment', amount: -25.0 };
    expect(() => validate(WalletTransactionSchema, adjustment)).not.toThrow();
  });

  it('should allow transaction without taskId', () => {
    const { taskId, ...transactionWithoutTask } = validTransaction;
    expect(() => validate(WalletTransactionSchema, transactionWithoutTask)).not.toThrow();
  });
});

describe('Validation helper functions', () => {
  const validData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test',
    phoneNumber: '+919876543210',
    storeAddress: 'Test Address',
    preferredLanguage: 'en',
    timezone: 'UTC',
    walletBalance: 0,
    registrationDate: '2024-01-01T00:00:00.000Z',
    lastActiveDate: '2024-01-01T00:00:00.000Z',
  };

  it('validate should return typed data on success', () => {
    const result = validate(ShopkeeperSchema, validData);
    expect(result.name).toBe('Test');
  });

  it('validate should throw on invalid data', () => {
    const invalid = { ...validData, id: 'not-a-uuid' };
    expect(() => validate(ShopkeeperSchema, invalid)).toThrow();
  });

  it('safeValidate should return success result', () => {
    const result = safeValidate(ShopkeeperSchema, validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test');
    }
  });

  it('safeValidate should return error result', () => {
    const invalid = { ...validData, id: 'not-a-uuid' };
    const result = safeValidate(ShopkeeperSchema, invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
