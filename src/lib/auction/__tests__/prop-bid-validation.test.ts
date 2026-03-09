/**
 * Property Test: Bid Validation Consistency
 * Feature: shelf-bidder, Property 6: Bid Validation Consistency
 * Validates: Requirements 3.3, 10.2
 *
 * For any bid submitted, validation should consistently accept valid bids
 * and reject invalid ones.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { validateBid, validateProductFit } from '../bid-validator';
import type { Auction, EmptySpace, ProductDetails } from '@/types/models';

const emptySpaceArb: fc.Arbitrary<EmptySpace> = fc.record({
  id: fc.uuid(),
  coordinates: fc.record({
    x: fc.constant(0),
    y: fc.constant(0),
    width: fc.integer({ min: 100, max: 500 }),
    height: fc.integer({ min: 100, max: 500 }),
  }),
  shelfLevel: fc.integer({ min: 1, max: 5 }),
  visibility: fc.constantFrom('high' as const, 'medium' as const, 'low' as const),
  accessibility: fc.constantFrom('easy' as const, 'moderate' as const, 'difficult' as const),
});

describe('Property 6: Bid Validation Consistency', () => {
  it('bids with non-positive amounts should always be rejected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10000, max: 0 }),
        emptySpaceArb,
        (amount, space) => {
          const auction: Auction = {
            id: 'auc-1',
            shelfSpaceId: 'shelf-1',
            startTime: new Date(Date.now() - 5 * 60000).toISOString(),
            endTime: new Date(Date.now() + 10 * 60000).toISOString(),
            status: 'active',
            bids: [],
          };

          const result = validateBid(
            { agentId: 'agent-1', amount, productDetails: { name: 'P', brand: 'B', category: 'C', dimensions: { width: 50, height: 50 } } },
            auction,
            space
          );
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('positive'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('bids on non-active auctions should always be rejected', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('completed' as const, 'cancelled' as const),
        fc.integer({ min: 1, max: 10000 }),
        emptySpaceArb,
        (status, amount, space) => {
          const auction: Auction = {
            id: 'auc-1',
            shelfSpaceId: 'shelf-1',
            startTime: new Date(Date.now() - 20 * 60000).toISOString(),
            endTime: new Date(Date.now() + 10 * 60000).toISOString(),
            status,
            bids: [],
          };

          const result = validateBid(
            { agentId: 'agent-1', amount, productDetails: { name: 'P', brand: 'B', category: 'C', dimensions: { width: 50, height: 50 } } },
            auction,
            space
          );
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('not active'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('products that are too large should always be rejected by validateProductFit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 500 }), // space width
        fc.integer({ min: 100, max: 500 }), // space height
        (spaceW, spaceH) => {
          const product: ProductDetails = {
            name: 'Big Product',
            brand: 'Brand',
            category: 'Cat',
            dimensions: { width: spaceW + 100, height: spaceH + 100 }, // always bigger
          };
          const space: EmptySpace = {
            id: 's1',
            coordinates: { x: 0, y: 0, width: spaceW, height: spaceH },
            shelfLevel: 2,
            visibility: 'high',
            accessibility: 'easy',
          };

          const errors = validateProductFit(product, space);
          expect(errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('products that fit should always pass validateProductFit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 500 }),
        fc.integer({ min: 100, max: 500 }),
        (spaceW, spaceH) => {
          const product: ProductDetails = {
            name: 'Small Product',
            brand: 'Brand',
            category: 'Cat',
            dimensions: { width: Math.floor(spaceW / 2), height: Math.floor(spaceH / 2) },
          };
          const space: EmptySpace = {
            id: 's1',
            coordinates: { x: 0, y: 0, width: spaceW, height: spaceH },
            shelfLevel: 2,
            visibility: 'high',
            accessibility: 'easy',
          };

          const errors = validateProductFit(product, space);
          expect(errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
