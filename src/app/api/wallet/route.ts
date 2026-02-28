import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { getBalance } from '@/lib/wallet/wallet-service';
import { WalletTransactionOperations } from '@/lib/db';

/**
 * GET /api/wallet
 * Returns the current wallet balance and recent transaction history.
 */
export async function GET(request: NextRequest) {
  try {
    const shopkeeperId = getShopkeeperIdFromRequest(request);

    // Get real-time balance
    const balance = await getBalance(shopkeeperId);

    // Get recent transactions
    const txnsRes = await WalletTransactionOperations.queryByShopkeeper(shopkeeperId);
    
    // Sort transactions by timestamp descending
    const rawTxns = txnsRes.items || [];
    const transactions = rawTxns.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Calculate today and week earnings
    const todayPrefix = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();

    let todayEarnings = 0;
    let weeklyEarnings = 0;

    transactions.forEach(txn => {
      if (txn.type === 'earning' && txn.status === 'completed') {
        if (txn.timestamp.startsWith(todayPrefix)) {
          todayEarnings += txn.amount;
        }
        if (txn.timestamp >= sevenDaysAgoIso) {
          weeklyEarnings += txn.amount;
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        balance,
        todayEarnings,
        weeklyEarnings,
        transactions,
      }
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('API Error in /api/wallet:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
