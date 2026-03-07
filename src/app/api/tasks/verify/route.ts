/**
 * API Route: Verify Task Completion
 * POST /api/tasks/verify
 * 
 * Task 4.3: Verifies task completion using Bedrock multi-model fallback chain
 * Implements proof verification with before/after photo comparison
 * Credits earnings using ACID transactions
 * 
 * Requirements: 5.3, 5.6, 13.1, 13.2, 13.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyTaskCompletion, getMediaType } from '@/lib/vision/bedrock-client';
import { getObject } from '@/lib/storage';
import { TaskOperations } from '@/lib/db/postgres/operations/task';
import { WalletTransactionOperations } from '@/lib/db/postgres/operations/wallet-transaction';
import { transaction } from '@/lib/db/postgres/client';
import type { VerificationResult } from '@/lib/db/postgres/types';

/**
 * Request body interface
 */
interface VerifyTaskRequest {
  taskId: string;
  shopkeeperId: string;
  beforePhotoUrl?: string;
  beforePhotoData?: string; // Base64 encoded
  afterPhotoUrl?: string;
  afterPhotoData?: string; // Base64 encoded
  mimeType?: string;
}

/**
 * POST handler for verifying task completion
 * Uses Bedrock multi-model fallback chain (Nova Pro → Nova Lite → Claude Haiku)
 * Implements ACID transaction for task completion and earnings credit
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: VerifyTaskRequest = await request.json();
    const {
      taskId,
      shopkeeperId,
      beforePhotoUrl,
      beforePhotoData,
      afterPhotoUrl,
      afterPhotoData,
      mimeType = 'image/jpeg',
    } = body;

    // Validate required fields
    if (!taskId || !shopkeeperId) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'taskId and shopkeeperId are required',
        },
        { status: 400 }
      );
    }

    if (!afterPhotoUrl && !afterPhotoData) {
      return NextResponse.json(
        {
          error: 'After photo is required',
          details: 'Either afterPhotoUrl or afterPhotoData must be provided',
        },
        { status: 400 }
      );
    }

    if (!beforePhotoUrl && !beforePhotoData) {
      return NextResponse.json(
        {
          error: 'Before photo is required',
          details: 'Either beforePhotoUrl or beforePhotoData must be provided for verification',
        },
        { status: 400 }
      );
    }

    // Get task details
    const task = await TaskOperations.getById(taskId);

    // Verify task belongs to shopkeeper
    if (task.shopkeeper_id !== shopkeeperId) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'Task does not belong to this shopkeeper',
        },
        { status: 403 }
      );
    }

    // Verify task is in correct state
    if (task.status === 'completed') {
      return NextResponse.json(
        {
          error: 'Task already completed',
          details: 'This task has already been verified and completed',
        },
        { status: 400 }
      );
    }

    // Parse task instructions (JSONB field)
    const instructions = typeof task.instructions === 'string' 
      ? JSON.parse(task.instructions) 
      : task.instructions;

    // Extract task details for verification
    const taskInstructions = instructions.description || instructions.text || 'Complete the product placement task';
    
    // Build product details from task instructions
    const productDetails = {
      name: instructions.product_name || instructions.productName || undefined,
      category: instructions.category || instructions.product_category || undefined,
      quantity: instructions.quantity || instructions.count || undefined,
      location: instructions.location || instructions.target_location || undefined,
    };

    console.log('[Verify] Task instructions:', taskInstructions);
    console.log('[Verify] Product details:', productDetails);

    // Get before image
    const beforeBuffer = await getImageBuffer(
      beforePhotoUrl,
      beforePhotoData,
      'before photo'
    );
    const beforeBase64 = beforeBuffer.toString('base64');

    // Get after image
    const afterBuffer = await getImageBuffer(
      afterPhotoUrl,
      afterPhotoData,
      'after photo'
    );
    const afterBase64 = afterBuffer.toString('base64');

    // Verify task completion using Bedrock fallback chain
    console.log(`[Verify] Starting verification for task ${taskId} with Bedrock fallback chain`);
    const verificationStart = Date.now();

    const bedrockResult = await verifyTaskCompletion(
      beforeBase64,
      afterBase64,
      getMediaType(mimeType),
      shopkeeperId,
      taskInstructions,
      productDetails
    );

    const verificationTime = Date.now() - verificationStart;
    console.log(`[Verify] Bedrock verification completed in ${verificationTime}ms`);

    // Check if verification meets performance requirement (30 seconds)
    if (verificationTime > 30000) {
      console.warn(
        `[Verify] ⚠️ Verification took ${verificationTime}ms, exceeding 30s requirement (Requirement 5.3)`
      );
    }

    // Prepare verification result for database
    const verificationResult: VerificationResult = {
      verified: bedrockResult.verified,
      confidence: bedrockResult.confidence,
      feedback: bedrockResult.feedback,
      issues: bedrockResult.issues || [],
      verified_at: new Date(),
    };

    // Store after photo URL (use provided URL or construct from data)
    const proofPhotoUrl = afterPhotoUrl || 'data:image/jpeg;base64,' + afterBase64.substring(0, 50) + '...';

    // Execute ACID transaction: Update task and credit earnings
    const result = await transaction(async (client) => {
      // Update task with verification result
      const updateTaskSql = `
        UPDATE tasks
        SET status = $1,
            completed_date = CURRENT_TIMESTAMP,
            proof_photo_url = $2,
            verification_result = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const taskResult = await client.query(updateTaskSql, [
        verificationResult.verified ? 'completed' : 'failed',
        proofPhotoUrl,
        JSON.stringify(verificationResult),
        taskId,
      ]);

      const updatedTask = taskResult.rows[0];

      // If verified, credit earnings to wallet
      let transaction = null;
      if (verificationResult.verified) {
        // Create wallet transaction
        const insertTransactionSql = `
          INSERT INTO wallet_transactions (
            shopkeeper_id, task_id, campaign_id,
            type, amount, description, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const transactionResult = await client.query(insertTransactionSql, [
          shopkeeperId,
          taskId,
          task.campaign_id,
          'earning',
          task.earnings,
          `Task completion earnings for task ${taskId}`,
          'completed',
        ]);

        transaction = transactionResult.rows[0];

        // Update shopkeeper wallet balance
        const updateBalanceSql = `
          UPDATE shopkeepers
          SET wallet_balance = wallet_balance + $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `;

        await client.query(updateBalanceSql, [task.earnings, shopkeeperId]);

        console.log(
          `[Verify] ✅ Earnings credited: ${task.earnings} to shopkeeper ${shopkeeperId}`
        );
      }

      return { task: updatedTask, transaction };
    });

    const totalTime = Date.now() - startTime;

    console.log(
      `[Verify] ✅ Task ${taskId} verification complete: verified=${verificationResult.verified}, time=${totalTime}ms`
    );

    // Return verification results
    return NextResponse.json({
      success: true,
      data: {
        taskId,
        shopkeeperId,
        verified: verificationResult.verified,
        confidence: verificationResult.confidence,
        feedback: verificationResult.feedback,
        issues: verificationResult.issues,
        earnings: verificationResult.verified ? task.earnings : 0,
        transactionId: result.transaction?.id,
        verificationTime,
        totalTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;

    console.error('[Verify] ❌ Error verifying task:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('NotFoundError')) {
        return NextResponse.json(
          {
            error: 'Task not found',
            message: error.message,
            totalTime,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('All Bedrock models failed')) {
        return NextResponse.json(
          {
            error: 'Verification service unavailable',
            message: 'All AI models are currently unavailable. Please try again later.',
            details: error.message,
            totalTime,
          },
          { status: 503 }
        );
      }
    }

    // Handle general errors
    return NextResponse.json(
      {
        error: 'Failed to verify task',
        message: error instanceof Error ? error.message : 'Unknown error',
        totalTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Get image buffer from URL or base64 data
 */
async function getImageBuffer(
  url: string | undefined,
  data: string | undefined,
  label: string
): Promise<Buffer> {
  if (data) {
    // Use provided base64 image data
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }

  if (url) {
    // Download from S3
    const key = extractS3KeyFromUrl(url);
    return await getObject(key);
  }

  throw new Error(`No ${label} provided`);
}

/**
 * Extract S3 key from S3 URL
 */
function extractS3KeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.replace(/^\/[^/]+\//, '').replace(/^\//, '');
  } catch (error) {
    throw new Error(`Invalid S3 URL: ${url}`);
  }
}
