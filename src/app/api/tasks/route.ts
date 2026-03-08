import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';

// Mock tasks for local development
const LOCAL_MOCK_TASKS = [
  {
    id: 'task-001',
    shopkeeperId: 'local-user',
    auctionId: 'auction-001',
    status: 'assigned',
    assignedDate: new Date().toISOString(),
    earnings: 120,
    productDetails: { name: 'Pepsi 500ml', brand: 'PepsiCo', dimensions: { width: 25, height: 35, depth: 8 }, weight: 500, imageUrl: '' },
    shelfLocation: { level: 2, coordinates: { x: 100, y: 200, width: 25, height: 35 } },
  },
  {
    id: 'task-002',
    shopkeeperId: 'local-user',
    auctionId: 'auction-002',
    status: 'in_progress',
    assignedDate: new Date(Date.now() - 86400000).toISOString(),
    earnings: 95,
    productDetails: { name: 'Lays Classic', brand: 'PepsiCo', dimensions: { width: 20, height: 30, depth: 6 }, weight: 200, imageUrl: '' },
    shelfLocation: { level: 1, coordinates: { x: 200, y: 150, width: 20, height: 30 } },
  },
  {
    id: 'task-003',
    shopkeeperId: 'local-user',
    auctionId: 'auction-003',
    status: 'completed',
    assignedDate: new Date(Date.now() - 172800000).toISOString(),
    completedDate: new Date(Date.now() - 86400000).toISOString(),
    earnings: 75,
    productDetails: { name: 'Maggi Noodles', brand: 'Nestle', dimensions: { width: 22, height: 28, depth: 7 }, weight: 350, imageUrl: '' },
    shelfLocation: { level: 3, coordinates: { x: 150, y: 120, width: 22, height: 28 } },
  },
];

const isLocalDev = () => {
  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || '';
  return process.env.NODE_ENV !== 'production' && (userPoolId.includes('localDev') || userPoolId === '');
};

/**
 * GET /api/tasks
 * Returns all tasks assigned to the current shopkeeper.
 */
export async function GET(request: NextRequest) {
  try {
    const shopkeeperId = getShopkeeperIdFromRequest(request);

    // ── Local dev mock response ──────────────────────────────────────
    if (isLocalDev()) {
      console.log(`[Local Dev] Tasks mock for shopkeeper: ${shopkeeperId}`);
      const tasks = LOCAL_MOCK_TASKS.map(t => ({ ...t, shopkeeperId }));
      return NextResponse.json({ success: true, data: { tasks, count: tasks.length } });
    }
    // ── End local dev mock ───────────────────────────────────────────

    // Production: PostgreSQL queries
    const { ShopkeeperOperations, TaskOperations } = await import('@/lib/db/postgres/operations');
    const shopkeeper = await ShopkeeperOperations.getByShopkeeperId(shopkeeperId);
    const tasksRes = await TaskOperations.queryByShopkeeper(shopkeeper.id, undefined, { limit: 100 });

    return NextResponse.json({
      success: true,
      data: { tasks: tasksRes.items, count: tasksRes.total },
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('API Error in /api/tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
