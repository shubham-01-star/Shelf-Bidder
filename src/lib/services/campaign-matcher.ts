/**
 * Campaign Matching Service
 * Task 5.1: Implement campaign matching system
 * 
 * Automatically matches campaigns with shelf spaces based on:
 * - Budget availability
 * - Location proximity
 * - Campaign priority (budget, distance, age)
 */

import { CampaignOperations } from '@/lib/db/postgres/operations/campaign';
import { TaskOperations } from '@/lib/db/postgres/operations/task';
import { transaction } from '@/lib/db/postgres/client';
import type { Campaign, EmptySpace } from '@/lib/db/postgres/types';
import { logger } from '@/lib/logger';

export interface CampaignMatchResult {
  matched: boolean;
  campaign?: Campaign;
  taskId?: string;
  earnings?: number;
  reason?: string;
}

export class CampaignMatcher {
  /**
   * Find and match a campaign for the given shelf space
   * Uses ACID transaction to ensure budget deduction and task creation are atomic
   */
  async matchCampaign(
    shopkeeperId: string,
    shelfSpaceId: string,
    location: string,
    emptySpaces: EmptySpace[]
  ): Promise<CampaignMatchResult> {
    try {
      // 1. Find matching campaigns
      const campaigns = await CampaignOperations.findMatchingCampaigns(
        location,
        0, // Minimum budget
        { limit: 10 }
      );

      if (campaigns.length === 0) {
        logger.info('No matching campaigns found', { location });
        return {
          matched: false,
          reason: 'No active campaigns available for your location',
        };
      }

      // 2. Select best campaign (highest budget first)
      const selectedCampaign = campaigns[0];
      const earnings = selectedCampaign.payout_per_task;

      // 3. Execute ACID transaction: deduct budget + create task
      const result = await this.createTaskWithBudgetDeduction(
        selectedCampaign.id,
        shopkeeperId,
        shelfSpaceId,
        earnings,
        emptySpaces
      );

      logger.info('Campaign matched successfully', {
        campaignId: selectedCampaign.id,
        shopkeeperId,
        taskId: result.taskId,
        earnings,
      });

      return {
        matched: true,
        campaign: selectedCampaign,
        taskId: result.taskId,
        earnings,
      };
    } catch (error) {
      logger.error('Campaign matching failed', error);
      return {
        matched: false,
        reason: 'Failed to match campaign. Please try again.',
      };
    }
  }

  /**
   * Create task with atomic budget deduction
   * Uses PostgreSQL transaction to ensure both operations succeed or both fail
   */
  private async createTaskWithBudgetDeduction(
    campaignId: string,
    shopkeeperId: string,
    shelfSpaceId: string,
    earnings: number,
    emptySpaces: EmptySpace[]
  ): Promise<{ taskId: string }> {
    return transaction(async (client) => {
      // 1. Deduct campaign budget with row-level lock
      const lockSql = `
        SELECT * FROM campaigns
        WHERE id = $1
        FOR UPDATE
      `;
      const lockResult = await client.query(lockSql, [campaignId]);

      if (lockResult.rows.length === 0) {
        throw new Error('Campaign not found');
      }

      const campaign = lockResult.rows[0];
      const currentBudget = parseFloat(campaign.remaining_budget);

      if (currentBudget < earnings) {
        throw new Error('Insufficient campaign budget');
      }

      const newBudget = currentBudget - earnings;

      // Update budget
      const updateSql = `
        UPDATE campaigns
        SET remaining_budget = $1::numeric,
            status = CASE
              WHEN $1::numeric <= 0 THEN 'completed'
              ELSE status
            END
        WHERE id = $2
      `;
      await client.query(updateSql, [newBudget, campaignId]);

      // 2. Create task
      const taskSql = `
        INSERT INTO tasks (
          campaign_id, shopkeeper_id, shelf_space_id,
          instructions, earnings, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      const instructions = {
        productName: campaign.product_name,
        brandName: campaign.brand_name,
        placementRequirements: campaign.placement_requirements,
        emptySpaces,
      };

      const taskResult = await client.query(taskSql, [
        campaignId,
        shopkeeperId,
        shelfSpaceId,
        JSON.stringify(instructions),
        earnings,
        'assigned',
      ]);

      const taskId = taskResult.rows[0].id;

      logger.info('Task created with budget deduction', {
        campaignId,
        taskId,
        budgetBefore: currentBudget,
        budgetAfter: newBudget,
      });

      return { taskId };
    });
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string) {
    const campaign = await CampaignOperations.getById(campaignId);
    
    // Get task statistics
    const tasksSql = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'assigned') as pending_tasks,
        SUM(earnings) FILTER (WHERE status = 'completed') as total_spent
      FROM tasks
      WHERE campaign_id = $1
    `;

    const { query } = await import('@/lib/db/postgres/client');
    const result = await query(tasksSql, [campaignId]);
    const stats = result.rows[0];

    return {
      campaign,
      stats: {
        totalTasks: parseInt(stats.total_tasks),
        completedTasks: parseInt(stats.completed_tasks),
        pendingTasks: parseInt(stats.pending_tasks),
        totalSpent: parseFloat(stats.total_spent || '0'),
        remainingBudget: campaign.remaining_budget,
        budgetUtilization: ((campaign.budget - campaign.remaining_budget) / campaign.budget) * 100,
      },
    };
  }
}

// Export singleton instance
export const campaignMatcher = new CampaignMatcher();
