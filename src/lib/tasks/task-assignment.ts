/**
 * Task Assignment Service
 *
 * Task 10.1: Implement task assignment system
 *
 * Creates tasks from auction results, tracks task status,
 * and manages task timeouts and reminders.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  TaskStatus,
  PlacementInstructions,
  EmptySpace,
} from '@/types/models';
import {
  TaskOperations,
  AuctionOperations,
  ShelfSpaceOperations,
} from '@/lib/db';

// ============================================================================
// Constants
// ============================================================================

/** Default time limit for task completion (hours) */
const DEFAULT_TASK_TIME_LIMIT_HOURS = 24;

/** Task is considered overdue after this many hours */
const TASK_OVERDUE_HOURS = 48;

// ============================================================================
// Errors
// ============================================================================

export class TaskAssignmentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TaskAssignmentError';
  }
}

// ============================================================================
// Task Creation from Auction Results
// ============================================================================

/**
 * Create a task from a completed auction
 *
 * When an auction completes with a winner, this function creates
 * the task that tells the shopkeeper what to place where.
 *
 * @param auctionId - The completed auction
 * @param shopkeeperId - The shopkeeper who owns the shelf
 * @returns The created task
 */
export async function createTaskFromAuction(
  auctionId: string,
  shopkeeperId: string
): Promise<Task> {
  // Fetch the auction
  const auction = await AuctionOperations.get(auctionId);

  if (auction.status !== 'completed') {
    throw new TaskAssignmentError(
      `Cannot create task from non-completed auction (status: ${auction.status})`,
      'AUCTION_NOT_COMPLETED'
    );
  }

  if (!auction.winnerId || !auction.winningBid) {
    throw new TaskAssignmentError(
      'Auction has no winner',
      'NO_WINNER'
    );
  }

  // Find the winning bid to get product details
  const winningBid = auction.bids.find(
    (b) => b.agentId === auction.winnerId && b.status === 'valid'
  );

  if (!winningBid) {
    throw new TaskAssignmentError(
      'Winning bid not found in auction bids',
      'WINNING_BID_NOT_FOUND'
    );
  }

  // Fetch shelf space for target location
  let targetLocation: EmptySpace;
  try {
    const shelfSpace = await ShelfSpaceOperations.get(auction.shelfSpaceId);
    targetLocation = shelfSpace.emptySpaces[0] || createDefaultTargetLocation();
  } catch {
    targetLocation = createDefaultTargetLocation();
  }

  // Build placement instructions
  const instructions: PlacementInstructions = {
    productName: winningBid.productDetails.name,
    brandName: winningBid.productDetails.brand,
    targetLocation,
    positioningRules: [
      `Place ${winningBid.productDetails.name} at the designated shelf space`,
      'Ensure product label faces forward',
      'Product should be stable and not obstructing other items',
    ],
    visualRequirements: [
      'Product must be clearly visible',
      'Brand name must be readable',
      'No other products should overlap',
    ],
    timeLimit: DEFAULT_TASK_TIME_LIMIT_HOURS,
  };

  // Create the task
  const task: Task = {
    id: uuidv4(),
    auctionId,
    shopkeeperId,
    instructions,
    status: 'assigned' as TaskStatus,
    assignedDate: new Date().toISOString(),
    earnings: auction.winningBid,
  };

  const created = await TaskOperations.create(task);
  return created;
}

// ============================================================================
// Task Status Management
// ============================================================================

/**
 * Start a task (shopkeeper begins working on placement)
 */
export async function startTask(
  taskId: string,
  shopkeeperId: string,
  assignedDate: string
): Promise<Task> {
  return TaskOperations.update(taskId, shopkeeperId, assignedDate, {
    status: 'in_progress' as TaskStatus,
  });
}

/**
 * Complete a task with proof photo
 */
export async function completeTask(
  taskId: string,
  shopkeeperId: string,
  assignedDate: string,
  proofPhotoUrl: string
): Promise<Task> {
  return TaskOperations.update(taskId, shopkeeperId, assignedDate, {
    status: 'completed' as TaskStatus,
    completedDate: new Date().toISOString(),
    proofPhotoUrl,
  });
}

/**
 * Fail a task (e.g., timeout or verification failure)
 */
export async function failTask(
  taskId: string,
  shopkeeperId: string,
  assignedDate: string
): Promise<Task> {
  return TaskOperations.update(taskId, shopkeeperId, assignedDate, {
    status: 'failed' as TaskStatus,
  });
}

// ============================================================================
// Task Queries
// ============================================================================

/**
 * Get all pending (assigned/in-progress) tasks for a shopkeeper
 */
export async function getPendingTasks(
  shopkeeperId: string
): Promise<Task[]> {
  const assigned = await TaskOperations.queryByStatus('assigned');
  const inProgress = await TaskOperations.queryByStatus('in_progress');

  const allPending = [...assigned.items, ...inProgress.items];
  return allPending.filter((t) => t.shopkeeperId === shopkeeperId);
}

/**
 * Check for overdue tasks and mark them as failed
 */
export async function checkOverdueTasks(): Promise<Task[]> {
  const assignedResult = await TaskOperations.queryByStatus('assigned');
  const inProgressResult = await TaskOperations.queryByStatus('in_progress');

  const allActive = [...assignedResult.items, ...inProgressResult.items];
  const now = new Date();
  const overdueTasks: Task[] = [];

  for (const task of allActive) {
    const assignedTime = new Date(task.assignedDate);
    const hoursElapsed = (now.getTime() - assignedTime.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed > TASK_OVERDUE_HOURS) {
      const failed = await TaskOperations.update(
        task.id,
        task.shopkeeperId,
        task.assignedDate,
        { status: 'failed' as TaskStatus }
      );
      overdueTasks.push(failed);
    }
  }

  return overdueTasks;
}

// ============================================================================
// Helpers
// ============================================================================

function createDefaultTargetLocation(): EmptySpace {
  return {
    id: 'default-location',
    coordinates: { x: 0, y: 0, width: 300, height: 150 },
    shelfLevel: 2,
    visibility: 'medium',
    accessibility: 'moderate',
  };
}

export { DEFAULT_TASK_TIME_LIMIT_HOURS, TASK_OVERDUE_HOURS };
