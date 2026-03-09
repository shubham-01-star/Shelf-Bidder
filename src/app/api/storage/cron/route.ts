/**
 * API Route: S3 Storage Monitoring Cron Job
 * POST /api/storage/cron
 * 
 * Scheduled endpoint for daily storage monitoring and lifecycle policy application
 * Should be triggered by AWS CloudWatch Events or external cron service
 * 
 * Security: Requires CRON_SECRET environment variable for authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitorAndApplyLifecyclePolicies } from '@/lib/storage';

/**
 * POST handler for scheduled storage monitoring
 * This endpoint should be called daily via cron job (e.g., AWS CloudWatch Events)
 */
export async function POST(request: NextRequest) {
  try {
    // Basic security: require an API key to trigger this cron job
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'dev-cron-secret'}`;
    
    if (authHeader !== expectedAuth) {
      console.warn('[Storage Cron] ⚠️  Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Storage Cron] 🔍 Daily storage monitoring triggered...');

    // Monitor storage and apply lifecycle policies if needed
    const result = await monitorAndApplyLifecyclePolicies();

    // Log the results
    console.log('[Storage Cron] 📊 Monitoring complete:', {
      totalGB: result.usage.totalGB.toFixed(2),
      percentOfFreeLimit: result.usage.percentOfFreeLimit.toFixed(1) + '%',
      lifecyclePolicyApplied: result.lifecyclePolicyApplied,
      recommendation: result.recommendation,
    });

    // Return monitoring results
    return NextResponse.json({
      success: true,
      message: 'Storage monitoring completed',
      data: {
        usage: {
          totalGB: parseFloat(result.usage.totalGB.toFixed(2)),
          percentOfFreeLimit: parseFloat(result.usage.percentOfFreeLimit.toFixed(1)),
          objectCount: result.usage.objectCount,
        },
        lifecyclePolicyApplied: result.lifecyclePolicyApplied,
        lifecycleResult: result.lifecycleResult,
        recommendation: result.recommendation,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Storage Cron] ❌ Error during scheduled monitoring:', error);
    
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
