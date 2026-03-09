/**
 * API Route: S3 Storage Usage
 * GET /api/storage/usage
 * 
 * Returns current S3 storage usage statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkStorageUsage } from '@/lib/storage';

/**
 * GET handler for storage usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Storage Usage API] 📊 Checking storage usage...');

    // Get current storage usage
    const usage = await checkStorageUsage();

    // Return usage statistics
    return NextResponse.json({
      success: true,
      data: {
        totalGB: parseFloat(usage.totalGB.toFixed(2)),
        totalBytes: usage.totalBytes,
        objectCount: usage.objectCount,
        percentOfFreeLimit: parseFloat(usage.percentOfFreeLimit.toFixed(1)),
        byPrefix: {
          shelf: {
            gb: parseFloat((usage.byPrefix.shelf.bytes / (1024 * 1024 * 1024)).toFixed(2)),
            bytes: usage.byPrefix.shelf.bytes,
            count: usage.byPrefix.shelf.count,
          },
          proof: {
            gb: parseFloat((usage.byPrefix.proof.bytes / (1024 * 1024 * 1024)).toFixed(2)),
            bytes: usage.byPrefix.proof.bytes,
            count: usage.byPrefix.proof.count,
          },
        },
        freeTierLimit: {
          totalGB: 5,
          remainingGB: parseFloat((5 - usage.totalGB).toFixed(2)),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Storage Usage API] ❌ Error checking storage usage:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check storage usage',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
