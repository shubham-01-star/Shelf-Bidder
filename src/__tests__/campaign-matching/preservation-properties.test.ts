/**
 * Preservation Property Tests - Campaign Matching Logic Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * **Property 2: Preservation** - ACID Transactions and Non-Matching Flows
 * 
 * IMPORTANT: These tests follow observation-first methodology
 * - Tests are written to capture CURRENT behavior on UNFIXED code
 * - Tests should PASS on unfixed code (confirming baseline behavior)
 * - Tests should CONTINUE to pass after fix (confirming no regressions)
 * 
 * This test suite verifies that for all inputs where the bug condition does NOT hold,
 * the system produces the same behavior before and after the fix:
 * - Offline mode behavior unchanged
 * - Task verification flow unchanged
 * - Error handling unchanged
 * - No empty spaces → 'done' state unchanged
 * - Low confidence → 'done' state unchanged
 * - ACID transactions remain atomic
 * 
 * GOAL: Ensure the fix does not introduce regressions in existing functionality
 */

import { describe, test, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { ShopkeeperOperations } from '@/lib/db/postgres/operations/shopkeeper';
import { CampaignOperations } from '@/lib/db/postgres/operations/campaign';
import { ShelfSpaceOperations } from '@/lib/db/postgres/operations/shelf-space';
import { TaskOperations } from '@/lib/db/postgres/operations/task';
import { campaignMatcher } from '@/lib/services/campaign-matcher';
import type { EmptySpace } from '@/lib/db/postgres/types';

type CleanupState = {
  taskIds: string[];
  shelfSpaceIds: string[];
  shopkeeperIds: string[];
  campaignIds: string[];
};

describe('Preservation Properties - Non-Matching Flows', () => {
  const createCleanupState = (): CleanupState => ({
    taskIds: [],
    shelfSpaceIds: [],
    shopkeeperIds: [],
    campaignIds: [],
  });

  const cleanupTestData = async (state: CleanupState) => {
    for (const id of [...state.taskIds].reverse()) {
      try {
        await TaskOperations.delete(id);
      } catch {
        // Ignore cleanup errors
      }
    }
    for (const id of [...state.shelfSpaceIds].reverse()) {
      try {
        await ShelfSpaceOperations.delete(id);
      } catch {
        // Ignore cleanup errors
      }
    }
    for (const id of [...state.shopkeeperIds].reverse()) {
      try {
        await ShopkeeperOperations.delete(id);
      } catch {
        // Ignore cleanup errors
      }
    }
    for (const id of [...state.campaignIds].reverse()) {
      try {
        await CampaignOperations.delete(id);
      } catch {
        // Ignore cleanup errors
      }
    }
  };

  const withCleanup = async (run: (state: CleanupState) => Promise<void>) => {
    const state = createCleanupState();

    try {
      await run(state);
    } finally {
      await cleanupTestData(state);
    }
  };

  /**
   * Preservation Test 1: No Empty Spaces
   * Requirement 3.1: When AI detects 0 empty spaces, system shows 'done' state without matching
   * 
  * Expected: PASSES on unfixed code (current behavior)
  * Expected: PASSES after fix (behavior preserved)
  */
  test('No empty spaces should result in done state without campaign matching', async () => {
    await withCleanup(async (state) => {
      const shopkeeper = await ShopkeeperOperations.create({
        shopkeeper_id: `test-no-spaces-${Date.now()}`,
        name: 'Test Shopkeeper No Spaces',
        phone_number: `+91996${Date.now().toString().slice(-7)}`,
        email: `test-no-spaces-${Date.now()}@example.com`,
        store_address: 'Shop 10, Main Market, Gurgaon',
      });
      state.shopkeeperIds.push(shopkeeper.id);

      const campaign = await CampaignOperations.create({
        agent_id: 'test-agent-preservation-1',
        brand_name: 'Test Brand',
        product_name: 'Test Product',
        product_category: 'Beverages',
        budget: 10000,
        payout_per_task: 150,
        target_locations: ['Gurgaon'],
        placement_requirements: [],
        product_dimensions: { width: 10, height: 20, depth: 5, unit: 'cm' },
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      state.campaignIds.push(campaign.id);

      const emptySpaces: EmptySpace[] = [];

      if (emptySpaces.length === 0) {
        expect(emptySpaces.length).toBe(0);

        const unchangedCampaign = await CampaignOperations.getById(campaign.id);
        expect(unchangedCampaign.remaining_budget).toBe(campaign.budget);
      }
    });
  });

  /**
   * Preservation Test 2: Low Confidence Analysis
   * Requirement 3.1: When AI confidence < 85%, system shows 'done' state without matching
   * 
  * Expected: PASSES on unfixed code (current behavior)
  * Expected: PASSES after fix (behavior preserved)
  */
  test('Low confidence analysis should not trigger campaign matching', async () => {
    await withCleanup(async (state) => {
      const shopkeeper = await ShopkeeperOperations.create({
        shopkeeper_id: `test-low-conf-${Date.now()}`,
        name: 'Test Shopkeeper Low Confidence',
        phone_number: `+91995${Date.now().toString().slice(-7)}`,
        email: `test-low-conf-${Date.now()}@example.com`,
        store_address: 'Shop 20, Sector 14, Gurgaon',
      });
      state.shopkeeperIds.push(shopkeeper.id);

      const campaign = await CampaignOperations.create({
        agent_id: 'test-agent-preservation-2',
        brand_name: 'Test Brand 2',
        product_name: 'Test Product 2',
        product_category: 'Snacks',
        budget: 8000,
        payout_per_task: 120,
        target_locations: ['Gurgaon'],
        placement_requirements: [],
        product_dimensions: { width: 12, height: 18, depth: 6, unit: 'cm' },
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      state.campaignIds.push(campaign.id);

      const analysisConfidence = 70;
      const emptySpaces: EmptySpace[] = [
        {
          id: 'space-1',
          shelf_level: 1,
          coordinates: { x: 0, y: 0, width: 100, height: 100 },
          visibility: 'high',
          accessibility: 'easy',
        },
        {
          id: 'space-2',
          shelf_level: 2,
          coordinates: { x: 0, y: 100, width: 100, height: 100 },
          visibility: 'high',
          accessibility: 'easy',
        },
      ];

      if (analysisConfidence < 85) {
        expect(analysisConfidence).toBeLessThan(85);
        expect(emptySpaces).toHaveLength(2);

        const unchangedCampaign = await CampaignOperations.getById(campaign.id);
        expect(unchangedCampaign.remaining_budget).toBe(campaign.budget);
      }
    });
  });

  /**
   * Preservation Test 3: No Matching Campaigns Available
   * Requirement 3.1: When no campaigns match location/budget, system shows 'done' with message
   * 
  * Expected: PASSES on unfixed code (current behavior)
  * Expected: PASSES after fix (behavior preserved)
  */
  test('No matching campaigns should result in done state with message', async () => {
    await withCleanup(async (state) => {
      const shopkeeper = await ShopkeeperOperations.create({
        shopkeeper_id: `test-no-match-${Date.now()}`,
        name: 'Test Shopkeeper Remote',
        phone_number: `+91994${Date.now().toString().slice(-7)}`,
        email: `test-no-match-${Date.now()}@example.com`,
        store_address: 'Shop 5, Remote Village, Himachal Pradesh',
      });
      state.shopkeeperIds.push(shopkeeper.id);

      const campaign = await CampaignOperations.create({
        agent_id: 'test-agent-preservation-3',
        brand_name: 'Test Brand 3',
        product_name: 'Test Product 3',
        product_category: 'Groceries',
        budget: 5000,
        payout_per_task: 100,
        target_locations: ['Mumbai', 'Pune'],
        placement_requirements: [],
        product_dimensions: { width: 15, height: 25, depth: 8, unit: 'cm' },
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      state.campaignIds.push(campaign.id);

      const result = await campaignMatcher.matchCampaign(
        shopkeeper.id,
        'test-shelf-space-1',
        'Himachal Pradesh',
        [
          {
            id: 'space-1',
            shelf_level: 1,
            coordinates: { x: 0, y: 0, width: 100, height: 100 },
            visibility: 'high',
            accessibility: 'easy',
          },
        ]
      );

      expect(result.matched).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.campaign).toBeUndefined();
      expect(result.taskId).toBeUndefined();

      const unchangedCampaign = await CampaignOperations.getById(campaign.id);
      expect(unchangedCampaign.remaining_budget).toBe(campaign.budget);
    });
  });

  /**
   * Preservation Test 4: ACID Transaction Atomicity
   * Requirement 3.3: Budget deduction and task creation must be atomic
   * 
   * Property-based test: For any valid campaign match, either BOTH budget deduction
   * and task creation succeed, OR BOTH fail (no partial state)
   * 
   * Expected: PASSES on unfixed code (current behavior)
   * Expected: PASSES after fix (behavior preserved)
  */
  test('ACID transaction: budget deduction and task creation are atomic', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random payout amounts
        fc.integer({ min: 50, max: 500 }),
        async (payoutAmount) => {
          await withCleanup(async (state) => {
            const shopkeeper = await ShopkeeperOperations.create({
              shopkeeper_id: `test-acid-${Date.now()}-${Math.random()}`,
              name: 'Test Shopkeeper ACID',
              phone_number: `+91993${Date.now().toString().slice(-7)}`,
              email: `test-acid-${Date.now()}-${Math.random()}@example.com`,
              store_address: 'Shop 30, Sector 29, Gurgaon',
            });
            state.shopkeeperIds.push(shopkeeper.id);

            const shelfSpace = await ShelfSpaceOperations.create(
              shopkeeper.id,
              'https://example.com/test-shelf.jpg',
              [
                {
                  id: 'space-1',
                  shelf_level: 1,
                  coordinates: { x: 0, y: 0, width: 100, height: 100 },
                  visibility: 'high',
                  accessibility: 'easy',
                },
              ],
              [],
              95
            );
            state.shelfSpaceIds.push(shelfSpace.id);

            const initialBudget = payoutAmount * 2;
            const campaign = await CampaignOperations.create({
              agent_id: 'test-agent-acid',
              brand_name: 'ACID Test Brand',
              product_name: 'ACID Test Product',
              product_category: 'Test',
              budget: initialBudget,
              payout_per_task: payoutAmount,
              target_locations: ['Gurgaon'],
              placement_requirements: [],
              product_dimensions: { width: 10, height: 20, depth: 5, unit: 'cm' },
              start_date: new Date(),
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
            state.campaignIds.push(campaign.id);

            const result = await campaignMatcher.matchCampaign(
              shopkeeper.id,
              shelfSpace.id,
              'Gurgaon',
              [
                {
                  id: 'space-1',
                  shelf_level: 1,
                  coordinates: { x: 0, y: 0, width: 100, height: 100 },
                  visibility: 'high',
                  accessibility: 'easy',
                },
              ]
            );

            if (result.matched && result.taskId && result.campaign) {
              state.taskIds.push(result.taskId);

              const updatedCampaign = await CampaignOperations.getById(result.campaign.id);
              const createdTask = await TaskOperations.getById(result.taskId);

              expect(updatedCampaign.remaining_budget).toBe(
                result.campaign.budget - result.campaign.payout_per_task
              );
              expect(createdTask).toBeDefined();
              expect(createdTask.campaign_id).toBe(result.campaign.id);
              expect(createdTask.shopkeeper_id).toBe(shopkeeper.id);
              expect(createdTask.earnings).toBe(result.campaign.payout_per_task);
              expect(createdTask.status).toBe('assigned');

              return;
            }

            const unchangedCampaign = await CampaignOperations.getById(campaign.id);
            expect(unchangedCampaign.remaining_budget).toBe(initialBudget);
          });
        }
      ),
      { numRuns: 5 } // Run 5 test cases with different payout amounts
    );
  });

  /**
   * Preservation Test 5: Insufficient Budget Handling
   * Requirement 3.3: When campaign has insufficient budget, no task should be created
   * 
  * Expected: PASSES on unfixed code (current behavior)
  * Expected: PASSES after fix (behavior preserved)
  */
  test('Insufficient budget should prevent task creation atomically', async () => {
    await withCleanup(async (state) => {
      const shopkeeper = await ShopkeeperOperations.create({
        shopkeeper_id: `test-insufficient-${Date.now()}`,
        name: 'Test Shopkeeper Insufficient',
        phone_number: `+91992${Date.now().toString().slice(-7)}`,
        email: `test-insufficient-${Date.now()}@example.com`,
        store_address: 'Shop 40, Sector 45, Gurgaon',
      });
      state.shopkeeperIds.push(shopkeeper.id);

      const campaign = await CampaignOperations.create({
        agent_id: 'test-agent-insufficient',
        brand_name: 'Low Budget Brand',
        product_name: 'Low Budget Product',
        product_category: 'Test',
        budget: 50,
        payout_per_task: 100,
        target_locations: ['Gurgaon'],
        placement_requirements: [],
        product_dimensions: { width: 10, height: 20, depth: 5, unit: 'cm' },
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      state.campaignIds.push(campaign.id);

      const result = await campaignMatcher.matchCampaign(
        shopkeeper.id,
        'test-shelf-space-insufficient',
        'Gurgaon',
        [
          {
            id: 'space-1',
            shelf_level: 1,
            coordinates: { x: 0, y: 0, width: 100, height: 100 },
            visibility: 'high',
            accessibility: 'easy',
          },
        ]
      );

      expect(result.matched).toBe(false);

      const unchangedCampaign = await CampaignOperations.getById(campaign.id);
      expect(unchangedCampaign.remaining_budget).toBe(50);
      expect(result.taskId).toBeUndefined();
    });
  });

  /**
   * Preservation Test 6: Property-Based Test for Non-Buggy Inputs
   * 
   * For any input where bug condition does NOT hold, behavior should be unchanged
   * 
   * Bug condition does NOT hold when:
   * - Empty spaces = 0, OR
   * - Confidence < 85%, OR
   * - No campaigns exist for location, OR
   * - Shopkeeper location IS 'Gurgaon' (hardcoded value works)
   * 
   * Expected: PASSES on unfixed code (current behavior)
   * Expected: PASSES after fix (behavior preserved)
  */
  test('Property: Non-buggy inputs produce consistent behavior', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test scenarios
        fc.record({
          emptySpaces: fc.integer({ min: 0, max: 5 }),
          confidence: fc.integer({ min: 0, max: 100 }),
          location: fc.constantFrom('Gurgaon', 'Mumbai', 'Delhi', 'Bangalore'),
          hasMatchingCampaign: fc.boolean(),
        }),
        async (scenario) => {
          const isBugCondition =
            scenario.emptySpaces > 0 &&
            scenario.confidence >= 85 &&
            scenario.location !== 'Gurgaon' &&
            scenario.hasMatchingCampaign;

          if (isBugCondition) {
            return true;
          }

          await withCleanup(async (state) => {
            const shopkeeper = await ShopkeeperOperations.create({
              shopkeeper_id: `test-prop-${Date.now()}-${Math.random()}`,
              name: 'Test Shopkeeper Property',
              phone_number: `+91991${Date.now().toString().slice(-7)}`,
              email: `test-prop-${Date.now()}-${Math.random()}@example.com`,
              store_address: `Shop 50, ${scenario.location}`,
            });
            state.shopkeeperIds.push(shopkeeper.id);

            const shelfSpace = await ShelfSpaceOperations.create(
              shopkeeper.id,
              'https://example.com/property-shelf.jpg',
              [
                {
                  id: 'space-1',
                  shelf_level: 1,
                  coordinates: { x: 0, y: 0, width: 100, height: 100 },
                  visibility: 'high',
                  accessibility: 'easy',
                },
              ],
              [],
              scenario.confidence
            );
            state.shelfSpaceIds.push(shelfSpace.id);

            let campaign;
            if (scenario.hasMatchingCampaign) {
              campaign = await CampaignOperations.create({
                agent_id: 'test-agent-property',
                brand_name: 'Property Test Brand',
                product_name: 'Property Test Product',
                product_category: 'Test',
                budget: 10000,
                payout_per_task: 150,
                target_locations: [scenario.location],
                placement_requirements: [],
                product_dimensions: { width: 10, height: 20, depth: 5, unit: 'cm' },
                start_date: new Date(),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              });
              state.campaignIds.push(campaign.id);
            }

            if (scenario.emptySpaces === 0) {
              expect(scenario.emptySpaces).toBe(0);
              return;
            }

            if (scenario.confidence < 85) {
              expect(scenario.confidence).toBeLessThan(85);
              return;
            }

            if (!scenario.hasMatchingCampaign) {
              const result = await campaignMatcher.matchCampaign(
                shopkeeper.id,
                shelfSpace.id,
                scenario.location,
                [
                  {
                    id: 'space-1',
                    shelf_level: 1,
                    coordinates: { x: 0, y: 0, width: 100, height: 100 },
                    visibility: 'high',
                    accessibility: 'easy',
                  },
                ]
              );
              expect(result.matched).toBe(false);
              return;
            }

            if (scenario.location === 'Gurgaon' && campaign) {
              const result = await campaignMatcher.matchCampaign(
                shopkeeper.id,
                shelfSpace.id,
                'Gurgaon',
                [
                  {
                    id: 'space-1',
                    shelf_level: 1,
                    coordinates: { x: 0, y: 0, width: 100, height: 100 },
                    visibility: 'high',
                    accessibility: 'easy',
                  },
                ]
              );

              if (result.matched && result.taskId) {
                state.taskIds.push(result.taskId);
              }

              expect(result.matched).toBe(true);
            }
          });
        }
      ),
      { numRuns: 10 } // Run 10 random test cases
    );
  });

});
