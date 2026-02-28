/**
 * Property Test: User Interface Consistency
 * Feature: shelf-bidder, Property 11: User Interface Consistency
 * Validates: Requirements 8.1, 8.2, 8.5
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import { handleError, AppError } from '@/lib/errors/error-handler';

describe('Property 11: User Interface Consistency', () => {
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

  it('every error should produce a non-empty title and message', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (msg, code) => {
          const result = handleError(new AppError(msg, code, 'User message'));
          expect(result.title.length).toBeGreaterThan(0);
          expect(result.message.length).toBeGreaterThan(0);
          expect(result.icon.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('every handled error should provide at least one action', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(new Error('generic')),
          fc.constant(new AppError('app', 'CODE', 'msg')),
          fc.constant(null),
          fc.constant('string error'),
        ),
        (error) => {
          const result = handleError(error);
          expect(result.actions.length).toBeGreaterThanOrEqual(1);
          for (const action of result.actions) {
            expect(action.label.length).toBeGreaterThan(0);
            expect(typeof action.action).toBe('function');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
