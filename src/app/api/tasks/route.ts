import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { TaskOperations } from '@/lib/db';

/**
 * GET /api/tasks
 * Returns all tasks assigned to the current shopkeeper.
 */
export async function GET(request: NextRequest) {
  try {
    const shopkeeperId = getShopkeeperIdFromRequest(request);

    const tasksRes = await TaskOperations.queryByShopkeeper(shopkeeperId);
    
    return NextResponse.json({
      success: true,
      data: {
        tasks: tasksRes.items || [],
        count: tasksRes.items?.length || 0,
      }
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('API Error in /api/tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
