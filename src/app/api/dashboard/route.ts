import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';

// Local dev mock data - returns realistic sample data without AWS
const LOCAL_MOCK_DASHBOARD = {
  todayEarnings: 245,
  weeklyEarnings: 1380,
  totalBalance: 3750,
  activeTasks: 2,
  completedToday: 1,
  pendingAuctions: 4,
};

const isLocalDev = () => {
  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || '';
  return process.env.NODE_ENV !== 'production' && (userPoolId.includes('localDev') || userPoolId === '');
};

/**
 * GET /api/dashboard
 * Returns aggregated dashboard data: today's earnings, weekly earnings,
 * total balance, active tasks, completed today, pending auctions.
 */
export async function GET(request: NextRequest) {
  try {
    const shopkeeperId = getShopkeeperIdFromRequest(request);

    // ── Local dev mock response ──────────────────────────────────────
    if (isLocalDev()) {
      console.log(`[Local Dev] Dashboard mock for shopkeeper: ${shopkeeperId}`);
      return NextResponse.json({ success: true, data: LOCAL_MOCK_DASHBOARD });
    }
    // ── End local dev mock ───────────────────────────────────────────

    // Production: PostgreSQL queries
    const {
      ShopkeeperOperations,
      TaskOperations,
      CampaignOperations,
      WalletTransactionOperations,
    } = await import('@/lib/db/postgres/operations');

    // Get shopkeeper balance
    const shopkeeper = await ShopkeeperOperations.getByShopkeeperId(shopkeeperId);
    const totalBalance = shopkeeper.wallet_balance;

    // Get tasks for this shopkeeper
    const tasksRes = await TaskOperations.queryByShopkeeper(shopkeeperId, undefined, { limit: 100 });
    const tasks = tasksRes.items;
    const activeTasks = tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const completedToday = tasks.filter(
      t => t.status === 'completed' && t.completed_date && new Date(t.completed_date) >= todayStart
    ).length;

    // Get earnings by querying transactions with date ranges
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [todayTxns, weeklyTxns] = await Promise.all([
      WalletTransactionOperations.queryByShopkeeper(shopkeeperId, todayStart, now, { limit: 1000 }),
      WalletTransactionOperations.queryByShopkeeper(shopkeeperId, sevenDaysAgo, now, { limit: 1000 }),
    ]);

    const sumEarnings = (items: typeof todayTxns.items) =>
      items.filter(t => t.type === 'earning' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

    const todayEarnings = sumEarnings(todayTxns.items);
    const weeklyEarnings = sumEarnings(weeklyTxns.items);

    // Get active campaigns count
    const campaignsRes = await CampaignOperations.queryActive({ limit: 1 });
    const pendingAuctions = campaignsRes.total;

    return NextResponse.json({
      success: true,
      data: { todayEarnings, weeklyEarnings, totalBalance, activeTasks, completedToday, pendingAuctions },
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('API Error in /api/dashboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
