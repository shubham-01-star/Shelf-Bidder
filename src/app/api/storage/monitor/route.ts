/**
 * API Route: S3 Storage Monitoring
 * GET /api/storage/monitor
 * 
 * Monitors S3 storage usage and automatically applies lifecycle policies
 * when storage exceeds 4.5GB (90% of 5GB Free Tier limit)
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitorAndApplyLifecyclePolicies } from '@/lib/storage';

/**
 * GET handler for storage monitoring
 * This endpoint should be called periodically (e.g., daily via cron job)
 * to monitor storage usage and apply lifecycle policies when needed
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Storage Monitor API] 🔍 Starting storage monitoring...');

    // Monitor storage and apply lifecycle policies if needed
    const result = await monitorAndApplyLifecyclePolicies();

    // Return monitoring results
    return NextResponse.json({
      success: true,
      data: {
        usage: {
          totalGB: parseFloat(result.usage.totalGB.toFixed(2)),
          totalBytes: result.usage.totalBytes,
          objectCount: result.usage.objectCount,
          percentOfFreeLimit: parseFloat(result.usage.percentOfFreeLimit.toFixed(1)),
          byPrefix: {
            shelf: {
              gb: parseFloat((result.usage.byPrefix.shelf.bytes / (1024 * 1024 * 1024)).toFixed(2)),
              count: result.usage.byPrefix.shelf.count,
            },
            proof: {
              gb: parseFloat((result.usage.byPrefix.proof.bytes / (1024 * 1024 * 1024)).toFixed(2)),
              count: result.usage.byPrefix.proof.count,
            },
          },
        },
        lifecyclePolicyApplied: result.lifecyclePolicyApplied,
        lifecycleResult: result.lifecycleResult,
        recommendation: result.recommendation,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Storage Monitor API] ❌ Error monitoring storage:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to monitor storage',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for manual lifecycle policy application
 * Allows manual triggering of lifecycle policy application
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Storage Monitor API] 🔄 Manual lifecycle policy application requested...');

    const { applyGlacierTransition, checkStorageUsage } = await import('@/lib/storage');

    // Check current usage
    const usage = await checkStorageUsage();

    // Apply lifecycle policies
    const result = await applyGlacierTransition();

    return NextResponse.json({
      success: result.success,
      data: {
        usage: {
          totalGB: parseFloat(usage.totalGB.toFixed(2)),
          percentOfFreeLimit: parseFloat(usage.percentOfFreeLimit.toFixed(1)),
        },
        lifecycleResult: result,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Storage Monitor API] ❌ Error applying lifecycle policies:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply lifecycle policies',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
