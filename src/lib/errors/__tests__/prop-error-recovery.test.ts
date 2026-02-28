/**
 * Property Test: Error Handling and Recovery
 * Feature: shelf-bidder, Property 12: Error Handling and Recovery
 * Validates: Requirements 8.3, 8.4, 9.3
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import {
  handleError,
  NetworkError,
  AIProcessingError,
  AuctionError,
  AuthenticationError,
  withRetry,
} from '../error-handler';

beforeEach(() => {
  Object.defineProperty(global, 'window', {
    value: { location: { reload: () => {}, href: '' } },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(global, 'navigator', {
    value: { onLine: true },
    writable: true,
    configurable: true,
  });
});

describe('Property 12: Error Handling and Recovery', () => {
  it('all error types should return user-friendly messages', () => {
    const errorArb = fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }).map(m => new NetworkError(m)),
      fc.string({ minLength: 1, maxLength: 50 }).map(m => new AIProcessingError(m)),
      fc.string({ minLength: 1, maxLength: 50 }).map(m => new AuctionError(m, 'ERR')),
      fc.string({ minLength: 1, maxLength: 50 }).map(m => new AuthenticationError(m)),
    );

    fc.assert(
      fc.property(errorArb, (error) => {
        const result = handleError(error);
        expect(result.title.length).toBeGreaterThan(0);
        expect(result.message.length).toBeGreaterThan(0);
        expect(result.actions.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('retryable errors should always have a retry action', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (msg) => {
          const error = new NetworkError(msg);
          expect(error.retryable).toBe(true);
          const result = handleError(error);
          const hasRetry = result.actions.some(a => a.label.includes('Try Again'));
          expect(hasRetry).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('withRetry should always succeed if function eventually succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 3 }), // number of failures before success
        async (failCount) => {
          let calls = 0;
          const fn = async () => {
            calls++;
            if (calls <= failCount) throw new Error('temp fail');
            return 'ok';
          };
          const result = await withRetry(fn, 3, 1);
          expect(result).toBe('ok');
        }
      ),
      { numRuns: 50 }
    );
  });
});
