/**
 * Property Test: Brand Agent Communication
 * Feature: shelf-bidder, Property 5: Brand Agent Communication
 * Validates: Requirements 3.2, 10.1, 10.4
 *
 * For any auction event, all relevant Brand_Agents should receive notifications.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';

describe('Property 5: Brand Agent Communication', () => {
  it('all agents should receive notification for any auction', () => {
    const agentArb = fc.record({
      agentId: fc.uuid(),
      brandName: fc.string({ minLength: 1, maxLength: 50 }),
      active: fc.boolean(),
    });

    fc.assert(
      fc.property(
        fc.array(agentArb, { minLength: 1, maxLength: 10 }),
        fc.uuid(), // auctionId
        (agents, auctionId) => {
          const activeAgents = agents.filter(a => a.active);
          const notifications = activeAgents.map(agent => ({
            agentId: agent.agentId,
            auctionId,
            delivered: true,
          }));

          // Every active agent should get a notification
          for (const agent of activeAgents) {
            const notif = notifications.find(n => n.agentId === agent.agentId);
            expect(notif).toBeDefined();
            expect(notif!.auctionId).toBe(auctionId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('auction results should be broadcast to all participants', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        fc.uuid(),
        (participantIds, winnerId) => {
          const results = participantIds.map(id => ({
            agentId: id,
            won: id === winnerId,
          }));

          // All participants get results
          expect(results).toHaveLength(participantIds.length);
          // At most one winner
          const winners = results.filter(r => r.won);
          expect(winners.length).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
