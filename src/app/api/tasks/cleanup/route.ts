/**
 * API Route: Cleanup Expired Tasks
 * POST /api/tasks/cleanup
 * 
 * Cron job endpoint to handle expired tasks and revert budget to campaigns
 * Should be called periodically (e.g., every hour) via cron service
 * 
 * Requirements: Budget escrow reversal for expired tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { transaction } from '@/lib/db/postgres/client';

/**
 * POST handler for cleaning up expired tasks
 * - Finds tasks that have expired (expires_at < NOW)
 * - Reverts budget back to campaigns
 * - Marks tasks as 'expired'
 * - Uses ACID transactions for data consistency
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cleanup] Starting expired tasks cleanup...');

    // Execute cleanup in ACID transaction
    const result = await transaction(async (client) => {
      // Find all expired tasks that haven't been processed
      const expiredTasksQuery = `
        SELECT t.id, t.campaign_id, t.earnings, t.shopkeeper_id, t.expires_at
        FROM tasks t
        WHERE t.status IN ('assigned', 'in_progress')
          AND t.expires_at < NOW()
        FOR UPDATE
      `;

      const expiredTasksResult = await client.query(expiredTasksQuery);
      const expiredTasks = expiredTasksResult.rows;

      if (expiredTasks.length === 0) {
        console.log('[Cleanup] No expired tasks found');
        return {
          expiredCount: 0,
          revertedBudget: 0,
          tasks: [],
        };
      }

      console.log(`[Cleanup] Found ${expiredTasks.length} expired tasks`);

      let totalRevertedBudget = 0;
      const processedTasks = [];

      // Process each expired task
      for (const task of expiredTasks) {
        // Revert budget back to campaign
        const revertBudgetQuery = `
          UPDATE campaigns
          SET remaining_budget = remaining_budget + $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING id, remaining_budget
        `;

        const revertResult = await client.query(revertBudgetQuery, [
          task.earnings,
          task.campaign_id,
        ]);

        if (revertResult.rows.length === 0) {
          console.warn(`[Cleanup] Campaign ${task.campaign_id} not found for task ${task.id}`);
          continue;
        }

        // Mark task as expired
        const expireTaskQuery = `
          UPDATE tasks
          SET status = 'expired',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING id, status
        `;

        await client.query(expireTaskQuery, [task.id]);

        totalRevertedBudget += parseFloat(task.earnings);
        processedTasks.push({
          taskId: task.id,
          campaignId: task.campaign_id,
          shopkeeperId: task.shopkeeper_id,
          revertedAmount: task.earnings,
          expiredAt: task.expires_at,
        });

        console.log(
          `[Cleanup] ✅ Task ${task.id} expired, reverted ₹${task.earnings} to campaign ${task.campaign_id}`
        );
      }

      return {
        expiredCount: expiredTasks.length,
        revertedBudget: totalRevertedBudget,
        tasks: processedTasks,
      };
    });

    const totalTime = Date.now() - startTime;

    console.log(
      `[Cleanup] ✅ Cleanup complete: ${result.expiredCount} tasks expired, ₹${result.revertedBudget} reverted, time=${totalTime}ms`
    );

    return NextResponse.json({
      success: true,
      data: {
        expiredCount: result.expiredCount,
        revertedBudget: result.revertedBudget,
        processedTasks: result.tasks,
        timestamp: new Date().toISOString(),
        executionTime: totalTime,
      },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;

    console.error('[Cleanup] ❌ Error during cleanup:', error);

    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        executionTime: totalTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for checking cleanup status
 * Returns count of tasks that need cleanup
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    // Count expired tasks
    const countQuery = `
      SELECT COUNT(*) as count
      FROM tasks
      WHERE status IN ('assigned', 'in_progress')
        AND expires_at < NOW()
    `;

    const result = await pool.query(countQuery);
    const expiredCount = parseInt(result.rows[0].count);

    await pool.end();

    return NextResponse.json({
      success: true,
      data: {
        expiredTasksCount: expiredCount,
        needsCleanup: expiredCount > 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Cleanup] ❌ Error checking status:', error);

    return NextResponse.json(
      {
        error: 'Status check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
