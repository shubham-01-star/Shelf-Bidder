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

    // Production: real DynamoDB calls
    const { getBalance } = await import('@/lib/wallet/wallet-service');
    const { WalletTransactionOperations } = await import('@/lib/db');

    const balance = await getBalance(shopkeeperId);
    const txnsRes = await WalletTransactionOperations.queryByShopkeeper(shopkeeperId);
    const rawTxns = txnsRes.items || [];
    const transactions = rawTxns.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const todayPrefix = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();

    let todayEarnings = 0;
    let weeklyEarnings = 0;
    transactions.forEach(txn => {
      if (txn.type === 'earning' && txn.status === 'completed') {
        if (txn.timestamp.startsWith(todayPrefix)) todayEarnings += txn.amount;
        if (txn.timestamp >= sevenDaysAgoIso) weeklyEarnings += txn.amount;
      }
    });

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
