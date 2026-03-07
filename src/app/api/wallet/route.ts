import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';

// Mock wallet data for local development
const LOCAL_MOCK_WALLET = {
  balance: 3750,
  todayEarnings: 245,
  weeklyEarnings: 1380,
  transactions: [
    {
      id: 'txn-001',
      shopkeeperId: 'local-user',
      type: 'earning',
      amount: 120,
      description: 'Pepsi 500ml placement - Shelf Level 2',
      taskId: 'task-001',
      timestamp: new Date().toISOString(),
      status: 'completed',
    },
    {
      id: 'txn-002',
      shopkeeperId: 'local-user',
      type: 'earning',
      amount: 125,
      description: 'Lays Classic placement - Shelf Level 1',
      taskId: 'task-002',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed',
    },
    {
      id: 'txn-003',
      shopkeeperId: 'local-user',
      type: 'earning',
      amount: 75,
      description: 'Maggi Noodles placement - Shelf Level 3',
      taskId: 'task-003',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
    },
    {
      id: 'txn-004',
      shopkeeperId: 'local-user',
      type: 'payout',
      amount: 500,
      description: 'Payout request to UPI',
      timestamp: new Date(Date.now() - 604800000).toISOString(),
      status: 'completed',
    },
  ],
};

const isLocalDev = () => {
  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || '';
  return process.env.NODE_ENV !== 'production' && (userPoolId.includes('localDev') || userPoolId === '');
};

/**
 * GET /api/wallet
 * Returns the current wallet balance and recent transaction history.
 */
export async function GET(request: NextRequest) {
  try {
    const shopkeeperId = getShopkeeperIdFromRequest(request);

    // ── Local dev mock response ──────────────────────────────────────
    if (isLocalDev()) {
      console.log(`[Local Dev] Wallet mock for shopkeeper: ${shopkeeperId}`);
      return NextResponse.json({ success: true, data: LOCAL_MOCK_WALLET });
    }
    // ── End local dev mock ───────────────────────────────────────────

    // Production: PostgreSQL queries
    const {
      ShopkeeperOperations,
      WalletTransactionOperations,
    } = await import('@/lib/db/postgres/operations');

    // Get balance from shopkeeper record
    const shopkeeper = await ShopkeeperOperations.getByShopkeeperId(shopkeeperId);
    const balance = shopkeeper.wallet_balance;

    // Get recent transactions (sorted by date desc in the query)
    const txnsRes = await WalletTransactionOperations.queryByShopkeeper(shopkeeperId, undefined, undefined, { limit: 50 });
    const transactions = txnsRes.items;

    // Get today and weekly earnings by querying with date ranges
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
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

    return NextResponse.json({
      success: true,
      data: { balance, todayEarnings, weeklyEarnings, transactions },
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('API Error in /api/wallet:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
