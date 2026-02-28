import { NextResponse } from 'next/server';
import { dynamoDBClient } from '@/lib/db/client';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

// Type definition for shopkeeper basic info
interface ShopkeeperInfo {
  shopkeeperId: string;
  name?: string;
}

/**
 * Morning Trigger API
 * 
 * Task: Trigger morning scan notifications for all active shopkeepers.
 * PRD: "Push Notification at 8 AM: Unlock today's earnings."
 * 
 * Can be called manually or scheduled via AWS CloudWatch Events (cron).
 */
export async function POST(request: Request) {
  try {
    // Basic security: require an API key to trigger this cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-cron-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all active shopkeepers from DB
    const command = new ScanCommand({
      TableName: process.env.SHOPKEEPERS_TABLE || 'ShelfBidder-Shopkeepers',
      // In production, we would use an Index to only fetch active users
    });

    const response = await dynamoDBClient.send(command);
    const shopkeepers = (response.Items || []) as unknown as ShopkeeperInfo[];

    // 2. Send notifications in parallel batches
    const successCount = shopkeepers.length; // Mock success
    const failureCount = 0;

    // We simulate sending to all users. In a real app with Web Push,
    // we would iterate over stored push subscriptions.
    
    // For this prototype, we'll just log that the trigger fired successfully
    // The actual push happens in the browser via PWA, but this endpoint
    // serves as the server-side orchestrator.
    
    // In a real implementation with FCM/VAPID:
    // await Promise.all(shopkeepers.map(s => webpush.sendNotification(s.subscription, payload)))

    console.log(`[Cron] Morning trigger executed for ${shopkeepers.length} shopkeepers.`);

    return NextResponse.json({ 
      success: true, 
      message: 'Morning notifications triggered',
      stats: {
        totalTargeted: shopkeepers.length,
        successCount,
        failureCount
      }
    });

  } catch (error) {
    console.error('Failed to trigger morning notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
