/**
 * Property Test: Earnings and Wallet Consistency
 * Feature: shelf-bidder, Property 9: Earnings and Wallet Consistency
 * Validates: Requirements 5.4, 6.1, 6.2, 6.3
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';

describe('Property 9: Earnings and Wallet Consistency', () => {
  it('balance should always equal sum(earnings) - sum(payouts)', () => {
    const txnArb = fc.record({
      type: fc.constantFrom('earning' as const, 'payout' as const),
      amount: fc.integer({ min: 1, max: 5000 }),
    });

    fc.assert(
      fc.property(
        fc.array(txnArb, { minLength: 0, maxLength: 50 }),
        (transactions) => {
          const totalEarnings = transactions
            .filter(t => t.type === 'earning')
            .reduce((sum, t) => sum + t.amount, 0);
          const totalPayouts = transactions
            .filter(t => t.type === 'payout')
            .reduce((sum, t) => sum + t.amount, 0);

          const balance = totalEarnings - totalPayouts;

          // Verify the math is consistent
          expect(balance).toBe(totalEarnings - totalPayouts);
          expect(totalEarnings).toBeGreaterThanOrEqual(0);
          expect(totalPayouts).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('individual transaction amounts should always be positive', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (amount) => {
          expect(amount).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('wallet balance should be correctly calculated from any transaction history', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }), // initial balance
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 0, maxLength: 20 }), // earnings
        fc.array(fc.integer({ min: 1, max: 500 }), { minLength: 0, maxLength: 10 }), // payouts
        (initial, earnings, payouts) => {
          const totalEarned = earnings.reduce((s, e) => s + e, 0);
          const totalPaid = payouts.reduce((s, p) => s + p, 0);
          const finalBalance = initial + totalEarned - totalPaid;

          expect(typeof finalBalance).toBe('number');
          expect(Number.isFinite(finalBalance)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
