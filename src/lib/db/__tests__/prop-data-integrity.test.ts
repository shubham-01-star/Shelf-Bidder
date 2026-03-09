/**
 * Property Test: Data Persistence and Integrity
 * Feature: shelf-bidder, Property 13: Data Persistence and Integrity
 * Validates: Requirements 9.1, 9.2, 9.4
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { ShopkeeperMapper } from '../mappers';
import type { Shopkeeper } from '@/types/models';

describe('Property 13: Data Persistence and Integrity', () => {
  // Safe ISO date string arbitrary that avoids RangeError from invalid Date objects
  const isoDateArb = fc.tuple(
    fc.integer({ min: 2024, max: 2026 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 59 }),
    fc.integer({ min: 0, max: 59 }),
  ).map(([y, m, d, h, mi, s]) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(s).padStart(2, '0')}.000Z`
  );

  it('Shopkeeper round-trip through mapper should preserve all fields', () => {
    // Generate UUID v4 format specifically
    const uuidV4Arb = fc.uuid().filter(uuid => {
      // UUID v4 has '4' in the 15th position (version field)
      return uuid.charAt(14) === '4';
    });

    const shopkeeperArb: fc.Arbitrary<Shopkeeper> = fc.record({
      id: uuidV4Arb,
      name: fc.string({ minLength: 1, maxLength: 50 }),
      phoneNumber: fc.constant('+919876543210'),
      storeAddress: fc.string({ minLength: 5, maxLength: 100 }),
      preferredLanguage: fc.constantFrom('hi', 'en', 'ta', 'te'),
      timezone: fc.constantFrom('Asia/Kolkata', 'UTC'),
      walletBalance: fc.integer({ min: 0, max: 100000 }),
      registrationDate: isoDateArb,
      lastActiveDate: isoDateArb,
    });

    fc.assert(
      fc.property(shopkeeperArb, (shopkeeper) => {
        const item = ShopkeeperMapper.toItem(shopkeeper);
        const restored = ShopkeeperMapper.fromItem(item);

        expect(restored.id).toBe(shopkeeper.id);
        expect(restored.name).toBe(shopkeeper.name);
        expect(restored.phoneNumber).toBe(shopkeeper.phoneNumber);
        expect(restored.storeAddress).toBe(shopkeeper.storeAddress);
        expect(restored.preferredLanguage).toBe(shopkeeper.preferredLanguage);
        expect(restored.timezone).toBe(shopkeeper.timezone);
        expect(restored.walletBalance).toBe(shopkeeper.walletBalance);
        expect(restored.registrationDate).toBe(shopkeeper.registrationDate);
        expect(restored.lastActiveDate).toBe(shopkeeper.lastActiveDate);
      }),
      { numRuns: 100 }
    );
  });

  it('mapped DynamoDB item should always have partition key', () => {
    // Generate UUID v4 format specifically
    const uuidV4Arb = fc.uuid().filter(uuid => {
      // UUID v4 has '4' in the 15th position (version field)
      return uuid.charAt(14) === '4';
    });

    const shopkeeperArb: fc.Arbitrary<Shopkeeper> = fc.record({
      id: uuidV4Arb,
      name: fc.string({ minLength: 1, maxLength: 50 }),
      phoneNumber: fc.constant('+919876543210'),
      storeAddress: fc.constant('123 Main St'),
      preferredLanguage: fc.constant('hi'),
      timezone: fc.constant('Asia/Kolkata'),
      walletBalance: fc.integer({ min: 0, max: 100000 }),
      registrationDate: fc.constant('2024-01-01T00:00:00.000Z'),
      lastActiveDate: fc.constant('2024-01-15T00:00:00.000Z'),
    });

    fc.assert(
      fc.property(shopkeeperArb, (shopkeeper) => {
        const item = ShopkeeperMapper.toItem(shopkeeper);
        expect(item).toHaveProperty('PK');
        expect(item).toHaveProperty('SK');
        expect(item.shopkeeperId).toBe(shopkeeper.id);
      }),
      { numRuns: 100 }
    );
  });
});
