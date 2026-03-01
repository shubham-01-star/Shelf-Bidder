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

    // Production: real DynamoDB calls
    const { getBalance } = await import('@/lib/wallet/wallet-service');
    const { TaskOperations, AuctionOperations, WalletTransactionOperations } = await import('@/lib/db');

    const totalBalance = await getBalance(shopkeeperId);
    const allTasksRes = await TaskOperations.queryByShopkeeper(shopkeeperId);
    const tasks = allTasksRes.items || [];
    const activeTasks = tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length;
    const todayPrefix = new Date().toISOString().split('T')[0];
    const completedToday = tasks.filter(t => t.status === 'completed' && t.completedDate?.startsWith(todayPrefix)).length;

    const txnsRes = await WalletTransactionOperations.queryByShopkeeper(shopkeeperId);
    const txns = txnsRes.items || [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();

    let todayEarnings = 0;
    let weeklyEarnings = 0;
    txns.forEach(txn => {
      if (txn.type === 'earning' && txn.status === 'completed') {
        if (txn.timestamp.startsWith(todayPrefix)) todayEarnings += txn.amount;
        if (txn.timestamp >= sevenDaysAgoIso) weeklyEarnings += txn.amount;
      }
    });

    const auctionsRes = await AuctionOperations.queryByStatus('active');
    const pendingAuctions = auctionsRes.items ? auctionsRes.items.length : 0;

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
