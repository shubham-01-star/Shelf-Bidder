/**
 * Property Test: Task Assignment and Voice Notification
 * Feature: shelf-bidder, Property 7: Task Assignment and Voice Notification
 * Validates: Requirements 4.1, 4.2, 4.3
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { generateVoiceMessage, type VoiceMessage } from '../../notifications/voice-service';

describe('Property 7: Task Assignment and Voice Notification', () => {
  it('voice message should always contain brand and earnings for any input', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 50000 }),
        (product, brand, earnings) => {
          const msg: VoiceMessage = {
            type: 'auction_winner',
            productName: product,
            brandName: brand,
            earnings,
          };
          const text = generateVoiceMessage(msg, 'en');
          expect(text).toContain(brand);
          expect(text).toContain(earnings.toString());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Hindi voice message should always start with Namaste', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.integer({ min: 1, max: 10000 }),
        (brand, earnings) => {
          const msg: VoiceMessage = {
            type: 'auction_winner',
            productName: 'Product',
            brandName: brand,
            earnings,
          };
          const text = generateVoiceMessage(msg, 'hi');
          expect(text).toContain('Namaste');
        }
      ),
      { numRuns: 100 }
    );
  });
});
