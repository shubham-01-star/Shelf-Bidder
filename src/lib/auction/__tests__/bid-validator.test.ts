/**
 * Unit tests for Bid Validator
 * Task 5.1: Auction Engine - Bid validation
 */

import { describe, it, expect } from '@jest/globals';
import { validateBid, validateProductFit } from '../bid-validator';
import type { Auction, Bid, EmptySpace, ProductDetails } from '@/types/models';

// ============================================================================
// Test Data
// ============================================================================

const createMockEmptySpace = (overrides?: Partial<EmptySpace>): EmptySpace => ({
  id: 'space-1',
  coordinates: { x: 0, y: 0, width: 300, height: 150 },
  shelfLevel: 2,
  visibility: 'high',
  accessibility: 'easy',
  ...overrides,
});

const createMockAuction = (overrides?: Partial<Auction>): Auction => ({
  id: 'auction-1',
  shelfSpaceId: 'shelf-1',
  startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
  endTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 mins from now
  status: 'active',
  bids: [],
  ...overrides,
});

const createMockProductDetails = (
  overrides?: Partial<ProductDetails>
): ProductDetails => ({
  name: 'Pepsi 500ml',
  brand: 'PepsiCo',
  category: 'Beverages',
  dimensions: { width: 100, height: 100 },
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('validateBid', () => {
  it('should accept a valid bid', () => {
    const auction = createMockAuction();
    const space = createMockEmptySpace();
    const bid = {
      agentId: 'agent-1',
      amount: 50,
      productDetails: createMockProductDetails(),
    };

    const result = validateBid(bid, auction, space);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject bid on non-active auction', () => {
    const auction = createMockAuction({ status: 'completed' });
    const space = createMockEmptySpace();
    const bid = {
      agentId: 'agent-1',
      amount: 50,
      productDetails: createMockProductDetails(),
    };

    const result = validateBid(bid, auction, space);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('not active')
    );
  });

  it('should reject bid on expired auction', () => {
    const auction = createMockAuction({
      endTime: new Date(Date.now() - 1000).toISOString(), // ended 1 sec ago
    });
    const space = createMockEmptySpace();
    const bid = {
      agentId: 'agent-1',
      amount: 50,
      productDetails: createMockProductDetails(),
    };

    const result = validateBid(bid, auction, space);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('expired')
    );
  });

  it('should reject bid with zero amount', () => {
    const auction = createMockAuction();
    const space = createMockEmptySpace();
    const bid = {
      agentId: 'agent-1',
      amount: 0,
      productDetails: createMockProductDetails(),
    };

    const result = validateBid(bid, auction, space);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('positive')
    );
  });

  it('should reject bid with negative amount', () => {
    const auction = createMockAuction();
    const space = createMockEmptySpace();
    const bid = {
      agentId: 'agent-1',
      amount: -10,
      productDetails: createMockProductDetails(),
    };

    const result = validateBid(bid, auction, space);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('positive')
    );
  });

  it('should reject duplicate bid from same agent', () => {
    const existingBid: Bid = {
      id: 'bid-1',
      agentId: 'agent-1',
      amount: 30,
      productDetails: createMockProductDetails(),
      timestamp: new Date().toISOString(),
      status: 'valid',
    };
    const auction = createMockAuction({ bids: [existingBid] });
    const space = createMockEmptySpace();
    const bid = {
      agentId: 'agent-1', // Same agent
      amount: 50,
      productDetails: createMockProductDetails(),
    };

    const result = validateBid(bid, auction, space);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('already placed')
    );
  });

  it('should allow bid from different agent even if one bid exists', () => {
    const existingBid: Bid = {
      id: 'bid-1',
      agentId: 'agent-1',
      amount: 30,
      productDetails: createMockProductDetails(),
      timestamp: new Date().toISOString(),
      status: 'valid',
    };
    const auction = createMockAuction({ bids: [existingBid] });
    const space = createMockEmptySpace();
    const bid = {
      agentId: 'agent-2', // Different agent
      amount: 50,
      productDetails: createMockProductDetails(),
    };

    const result = validateBid(bid, auction, space);

    expect(result.valid).toBe(true);
  });

  it('should reject bid when product is too wide for space', () => {
    const auction = createMockAuction();
    const space = createMockEmptySpace({
      coordinates: { x: 0, y: 0, width: 50, height: 150 },
    });
    const bid = {
      agentId: 'agent-1',
      amount: 50,
      productDetails: createMockProductDetails({
        dimensions: { width: 100, height: 50 },
      }),
    };

    const result = validateBid(bid, auction, space);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('width')
    );
  });

  it('should collect multiple errors at once', () => {
    const auction = createMockAuction({ status: 'completed' });
    const space = createMockEmptySpace();
    const bid = {
      agentId: 'agent-1',
      amount: -5,
      productDetails: createMockProductDetails(),
    };

    const result = validateBid(bid, auction, space);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('validateProductFit', () => {
  it('should pass when product fits within space', () => {
    const product = createMockProductDetails({
      dimensions: { width: 100, height: 100 },
    });
    const space = createMockEmptySpace({
      coordinates: { x: 0, y: 0, width: 300, height: 150 },
    });

    const errors = validateProductFit(product, space);

    expect(errors).toHaveLength(0);
  });

  it('should fail when product width exceeds space', () => {
    const product = createMockProductDetails({
      dimensions: { width: 500, height: 100 },
    });
    const space = createMockEmptySpace({
      coordinates: { x: 0, y: 0, width: 300, height: 150 },
    });

    const errors = validateProductFit(product, space);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('width');
  });

  it('should fail when product height exceeds space', () => {
    const product = createMockProductDetails({
      dimensions: { width: 100, height: 200 },
    });
    const space = createMockEmptySpace({
      coordinates: { x: 0, y: 0, width: 300, height: 150 },
    });

    const errors = validateProductFit(product, space);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('height');
  });
});
