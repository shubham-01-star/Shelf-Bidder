import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { TaskOperations } from '@/lib/db';

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

/**
 * POST /api/tasks/:taskId/start
 * Updates a task status from 'assigned' to 'in_progress'
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const shopkeeperId = getShopkeeperIdFromRequest(request);
    const { taskId } = await context.params;

    // We don't have the assignedDate easily available in the URL, 
    // so we must query the task first to get its sort key (assignedDate).
    // Let's use the GSI to get the task.
    const taskDetails = await TaskOperations.getById(taskId);

    if (taskDetails.shopkeeperId !== shopkeeperId) {
      return NextResponse.json({ error: 'Unauthorized to access this task' }, { status: 403 });
    }

    if (taskDetails.status !== 'assigned') {
      return NextResponse.json({ error: 'Task is not in assigned state' }, { status: 400 });
    }

    // Update status.
    const updatedTask = await TaskOperations.update(
      taskId,
      shopkeeperId,
      taskDetails.assignedDate,
      { status: 'in_progress' }
    );

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
