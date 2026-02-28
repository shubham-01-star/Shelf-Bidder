import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { getBalance } from '@/lib/wallet/wallet-service';
import { TaskOperations, AuctionOperations, WalletTransactionOperations } from '@/lib/db';

/**
 * GET /api/dashboard
 * Returns aggregated dashboard data: today's earnings, weekly earnings, 
 * total balance, active tasks, completed today, pending auctions.
 */
export async function GET(request: NextRequest) {
  try {
    const shopkeeperId = getShopkeeperIdFromRequest(request);

    // 1. Get total balance
    const totalBalance = await getBalance(shopkeeperId);

    // 2. Get active tasks (assigned or in_progress)
    const allTasksRes = await TaskOperations.queryByShopkeeper(shopkeeperId);
    const tasks = allTasksRes.items || [];
    
    const activeTasks = tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length;
    
    // We consider "today" as matching the current date string (simple prefix check for MVP)
    const todayPrefix = new Date().toISOString().split('T')[0];
    const completedToday = tasks.filter(t => t.status === 'completed' && t.completedDate?.startsWith(todayPrefix)).length;

    // 3. Get transactions to calculate today's and weekly earnings
    const txnsRes = await WalletTransactionOperations.queryByShopkeeper(shopkeeperId);
    const txns = txnsRes.items || [];
    
    // Simple 7-day cutoff implementation for MVP
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();

    let todayEarnings = 0;
    let weeklyEarnings = 0;

    txns.forEach(txn => {
      if (txn.type === 'earning' && txn.status === 'completed') {
        if (txn.timestamp.startsWith(todayPrefix)) {
          todayEarnings += txn.amount;
        }
        if (txn.timestamp >= sevenDaysAgoIso) {
          weeklyEarnings += txn.amount;
        }
      }
    });

    // 4. Get active auctions
    // Currently, active auctions are global or by shelf-space. 
    // We do a simple scan for 'active' auctions for the dashboard metric.
    const auctionsRes = await AuctionOperations.queryByStatus('active');
    const pendingAuctions = auctionsRes.items ? auctionsRes.items.length : 0;

    return NextResponse.json({
      success: true,
      data: {
        todayEarnings,
        weeklyEarnings,
        totalBalance,
        activeTasks,
        completedToday,
        pendingAuctions,
      }
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('API Error in /api/dashboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
