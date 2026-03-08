import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { TaskOperations } from '@/lib/db/postgres/operations';

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

/**
 * POST /api/tasks/:taskId/start
 * Updates a task status from 'assigned' to 'in_progress'
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const shopkeeperIdFromToken = getShopkeeperIdFromRequest(request);
    const { taskId } = await context.params;

    // Get shopkeeper UUID from shopkeeper_id
    const { ShopkeeperOperations } = await import('@/lib/db/postgres/operations');
    const shopkeeper = await ShopkeeperOperations.getByShopkeeperId(shopkeeperIdFromToken);

    const taskDetails = await TaskOperations.getById(taskId);

    // Compare using UUID (shopkeeper.id) instead of shopkeeper_id
    if (taskDetails.shopkeeper_id !== shopkeeper.id) {
      return NextResponse.json({ error: 'Unauthorized to access this task' }, { status: 403 });
    }

    if (taskDetails.status !== 'assigned') {
      return NextResponse.json({ error: 'Task is not in assigned state' }, { status: 400 });
    }

    // PostgreSQL updateStatus only needs (id, status)
    const updatedTask = await TaskOperations.updateStatus(taskId, 'in_progress');

    return NextResponse.json({
      success: true,
      data: updatedTask,
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('API Error in /api/tasks/[taskId]/start:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
