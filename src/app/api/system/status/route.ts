import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/lib/logger';

/**
 * System Status API
 * Task 15.1: System integration and monitoring
 * 
 * Provides high-level system statistics and status
 */

export async function GET() {
  try {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    
    // Get counts from various tables (with limits to avoid expensive scans)
    const [shopkeepersResult, auctionsResult, tasksResult] = await Promise.allSettled([
      client.send(new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE_SHOPKEEPERS || 'shelf-bidder-shopkeepers',
        Select: 'COUNT',
        Limit: 1000,
      })),
      client.send(new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE_AUCTIONS || 'shelf-bidder-auctions',
        Select: 'COUNT',
        Limit: 1000,
      })),
      client.send(new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE_TASKS || 'shelf-bidder-tasks',
        Select: 'COUNT',
        Limit: 1000,
      })),
    ]);
    
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      region: process.env.AWS_REGION,
      version: '1.0.0',
      statistics: {
        totalShopkeepers: shopkeepersResult.status === 'fulfilled' 
          ? shopkeepersResult.value.Count || 0 
          : 0,
        totalAuctions: auctionsResult.status === 'fulfilled' 
          ? auctionsResult.value.Count || 0 
          : 0,
        totalTasks: tasksResult.status === 'fulfilled' 
          ? tasksResult.value.Count || 0 
          : 0,
      },
      features: {
        authentication: !!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        photoProcessing: !!process.env.S3_BUCKET_PHOTOS,
        visionAnalysis: !!process.env.AWS_REGION,
        auctionEngine: !!process.env.DYNAMODB_TABLE_AUCTIONS,
        notifications: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        voiceNotifications: !!process.env.AWS_CONNECT_INSTANCE_ID,
        wallet: !!process.env.DYNAMODB_TABLE_TRANSACTIONS,
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
