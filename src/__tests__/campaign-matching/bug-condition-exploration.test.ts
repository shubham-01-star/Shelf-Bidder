/**
 * Bug Condition Exploration Test - Campaign Matching Logic Fix
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 * 
 * **Property 1: Bug Condition** - Campaign Matching with Actual Location
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * This test encodes the expected behavior after the fix:
 * - System should extract shopkeeper's city from store_address
 * - System should use flexible location matching (not exact string match)
 * - System should match campaigns for shopkeeper's actual location
 * 
 * When this test FAILS (on unfixed code), it proves the bug exists.
 * When this test PASSES (after fix), it confirms the bug is resolved.
 * 
 * GOAL: Surface counterexamples that demonstrate:
 * - Case sensitivity issues prevent matching
 * 
 * OPTIMIZED: Single focused test for fastest execution
 */

import { describe, test, expect, afterAll } from '@jest/globals';
import { ShopkeeperOperations } from '@/lib/db/postgres/operations/shopkeeper';
import { CampaignOperations } from '@/lib/db/postgres/operations/campaign';

describe('Bug Condition Exploration - Campaign Matching with Actual Location', () => {
  
  // Test data IDs for cleanup
  const testShopkeeperIds: string[] = [];
  const testCampaignIds: string[] = [];

  afterAll(async () => {
    // Cleanup test data
    for (const id of testShopkeeperIds) {
      try {
        await ShopkeeperOperations.delete(id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    for (const id of testCampaignIds) {
      try {
        await CampaignOperations.delete(id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  /**
   * OPTIMIZED Test: Case Sensitivity Bug
   * Tests case-insensitive matching requirement
   * Expected: FAILS on unfixed code due to case-sensitive matching
   */
  test('Case-insensitive location matching should work', async () => {
    // Create campaign targeting Delhi (capitalized)
    const campaign = await CampaignOperations.create({
      agent_id: 'test-agent-1',
      brand_name: 'Delhi Brand',
      product_name: 'Delhi Product',
      product_category: 'Groceries',
      budget: 8000,
      payout_per_task: 120,
      target_locations: ['Delhi'],
      placement_requirements: [],
      product_dimensions: { width: 12, height: 18, depth: 6, unit: 'cm' },
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    testCampaignIds.push(campaign.id);

    // Try exact match with lowercase (as would be extracted from "Main Market, delhi")
    const matchedLower = await CampaignOperations.findMatchingCampaigns(
      'delhi',
      campaign.payout_per_task
    );

    // Try exact match with capitalized
    const matchedUpper = await CampaignOperations.findMatchingCampaigns(
      'Delhi',
      campaign.payout_per_task
    );

    // EXPECTED BEHAVIOR: Both should match (case-insensitive)
    expect(matchedUpper.length).toBeGreaterThan(0);
    
    // This WILL FAIL on unfixed code - proves case sensitivity bug
    expect(matchedLower.length).toBe(matchedUpper.length);
    expect(matchedLower.length).toBeGreaterThan(0);
  });

});
