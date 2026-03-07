/**
 * API Route: Wallet Withdrawal (Fake for Demo)
 * POST /api/wallet/withdraw
 * 
 * Implements fake withdrawal functionality for hackathon demo
 * Creates a payout transaction and deducts from balance
 * 
 * Requirements: 6.4, 6.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';

// Mock withdrawal for local development
const isLocalDev = () => {
  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || '';
  return process.env.NODE_ENV !== 'production' && (userPoolId.includes('localDev') || userPoolId === '');
};

/**
 * POST /api/wallet/withdraw
 * Request a withdrawal from wallet balance
 */
export async function POST(request: NextRequest) {
  try {
    const shopkeeperId = getShopkeeperIdFromRequest(request);
    const body = await request.json();
    const { amount } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount', details: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // ── Local dev mock response ──────────────────────────────────────
    if (isLocalDev()) {
      console.log(`[Local Dev] Mock withdrawal for shopkeeper: ${shopkeeperId}, amount: ₹${amount}`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json({
        success: true,
        data: {
          transactionId: `txn-withdraw-${Date.now()}`,
          shopkeeperId,
          amount,
          status: 'completed',
          message: `Successfully withdrawn ₹${amount} to your bank account`,
          bankAccount: 'State Bank of India •••• 1234',
          timestamp: new Date().toISOString(),
        },
      });
    }
    // ── End local dev mock ───────────────────────────────────────────

    // Production: real withdrawal processing
    const { requestPayout } = await import('@/lib/wallet/wallet-service');

    try {
      const transaction = await requestPayout(shopkeeperId, amount);

      return NextResponse.json({
        success: true,
        data: {
          transactionId: transaction.id,
          shopkeeperId: transaction.shopkeeperId,
          amount: transaction.amount,
          status: transaction.status,
          message: `Withdrawal request submitted for ₹${amount}`,
          bankAccount: 'State Bank of India •••• 1234',
          timestamp: transaction.timestamp,
        },
      });
    } catch (error: any) {
      // Handle wallet service errors
      if (error.name === 'WalletError') {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            details: error.details,
          },
          { status: 400 }
        );
      }
      throw error;
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('API Error in /api/wallet/withdraw:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
