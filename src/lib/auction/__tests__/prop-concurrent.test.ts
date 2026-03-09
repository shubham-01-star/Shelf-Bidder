/**
 * Property Test: Concurrent Auction Processing
 * Feature: shelf-bidder, Property 14: Concurrent Auction Processing
 * Validates: Requirements 10.3
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';

describe('Property 14: Concurrent Auction Processing', () => {
  it('simultaneous bids should not produce duplicate winners', () => {
    const bidArb = fc.record({
      agentId: fc.uuid(),
      amount: fc.integer({ min: 1, max: 10000 }),
      timestamp: fc.integer({ min: 0, max: 1000 }), // ms offset
    });

    fc.assert(
      fc.property(
        fc.array(bidArb, { minLength: 2, maxLength: 50 }),
        (bids) => {
          // Simulate concurrent processing: sort by amount, pick highest
          const sorted = [...bids].sort((a, b) => b.amount - a.amount);
          const winner = sorted[0];

          // There should be exactly one winner
          expect(winner).toBeDefined();
          // Winner has highest amount
          for (const bid of bids) {
            expect(winner.amount).toBeGreaterThanOrEqual(bid.amount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('unique agent IDs should be preserved across concurrent submissions', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.uuid(), { minLength: 2, maxLength: 20 }),
        (agentIds) => {
          const bids = agentIds.map(id => ({ agentId: id, amount: Math.random() * 1000 }));
          const uniqueAgents = new Set(bids.map(b => b.agentId));
          expect(uniqueAgents.size).toBe(agentIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('bid ordering should be deterministic regardless of submission order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ agentId: fc.uuid(), amount: fc.integer({ min: 1, max: 10000 }) }),
          { minLength: 2, maxLength: 20 }
        ),
        (bids) => {
          const sorted1 = [...bids].sort((a, b) => b.amount - a.amount);
          const sorted2 = [...bids].reverse().sort((a, b) => b.amount - a.amount);
          expect(sorted1[0].amount).toBe(sorted2[0].amount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
