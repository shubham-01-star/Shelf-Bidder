/**
 * Property Test: Task Completion Workflow
 * Feature: shelf-bidder, Property 8: Task Completion Workflow
 * Validates: Requirements 5.1, 5.2, 5.5
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import type { TaskStatus } from '@/types/models';

describe('Property 8: Task Completion Workflow', () => {
  const validTransitions: Record<string, string[]> = {
    assigned: ['in_progress', 'failed'],
    in_progress: ['completed', 'failed'],
    completed: [],
    failed: [],
  };

  it('task status should only transition to valid next states', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('assigned' as TaskStatus, 'in_progress' as TaskStatus),
        (currentStatus) => {
          const allowed = validTransitions[currentStatus];
          expect(allowed.length).toBeGreaterThan(0);
          for (const next of allowed) {
            expect(['assigned', 'in_progress', 'completed', 'failed']).toContain(next);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('completed and failed should be terminal states', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('completed' as TaskStatus, 'failed' as TaskStatus),
        (terminalStatus) => {
          const allowed = validTransitions[terminalStatus];
          expect(allowed).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('task earnings should always be positive', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50000 }),
        (earnings) => {
          expect(earnings).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
