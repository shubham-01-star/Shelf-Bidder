/**
 * Property Test: Morning Notification Timing
 * Feature: shelf-bidder, Property 1: Morning Notification Timing
 * Validates: Requirements 1.1, 1.4
 * 
 * For any timezone, morning notification = 8AM, reminder = 12PM.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { msUntilHour } from '../push-service';

describe('Property 1: Morning Notification Timing', () => {
  it('msUntilHour should always return > 0 and <= 24h for any valid hour', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        (hour) => {
          const ms = msUntilHour(hour, 'Asia/Kolkata');
          expect(ms).toBeGreaterThan(0);
          expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('morning (8AM) delay should always be positive', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'),
        (tz) => {
          const ms = msUntilHour(8, tz);
          expect(ms).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('reminder (12PM) delay should always be positive', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'),
        (tz) => {
          const ms = msUntilHour(12, tz);
          expect(ms).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
