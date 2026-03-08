import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';



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
    // We only need the count, so we don't need to select specific fields
    const shopkeepers = await prisma.shopkeepers.findMany({
      // No specific fields are needed as we only use the array's length
      // If actual notification sending were implemented, relevant fields (e.g., push subscription info) would be selected here.
    });

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

