import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * System Status API
 * Task 15.1: System integration and monitoring
 * 
 * Provides high-level system statistics and status
 */

export async function GET() {
  try {
    // Get counts from various tables
    const [shopkeepersCount, campaignsCount, tasksCount] = await Promise.allSettled([
      prisma.shopkeepers.count(),
      prisma.campaigns.count(),
      prisma.tasks.count()
    ]);
    
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      region: process.env.AWS_REGION || 'local',
      version: '1.0.0',
      statistics: {
        totalShopkeepers: shopkeepersCount.status === 'fulfilled' ? shopkeepersCount.value : 0,
        totalAuctions: campaignsCount.status === 'fulfilled' ? campaignsCount.value : 0,
        totalTasks: tasksCount.status === 'fulfilled' ? tasksCount.value : 0,
      },
      features: {
        authentication: true, // Now handled locally/DB
        photoProcessing: !!(process.env.PHOTO_BUCKET_NAME || process.env.S3_BUCKET_PHOTOS),
        visionAnalysis: !!(
          process.env.BEDROCK_REGION ||
          process.env.BEDROCK_REGION_OVERRIDE ||
          process.env.AWS_REGION
        ),
        auctionEngine: true, // Now in Postgres
        notifications: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        voiceNotifications: !!(
          process.env.CONNECT_INSTANCE_ID ||
          process.env.AWS_CONNECT_INSTANCE_ID
        ),
        wallet: true, // Now in Postgres
      },
    };
    
    logger.info('System status retrieved', status.statistics);
    
    return NextResponse.json(status);
  } catch (error) {
    logger.error('Failed to retrieve system status', error);
    return NextResponse.json(
      { error: 'Failed to retrieve system status' },
      { status: 500 }
    );
  }
}
