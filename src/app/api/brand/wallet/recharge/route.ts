/**
 * API Route: Brand Wallet Recharge (Fake for Demo)
 * POST /api/brand/wallet/recharge
 * 
 * Implements fake wallet recharge functionality for brand accounts
 * Simulates payment gateway integration for hackathon demo
 */

import { NextRequest, NextResponse } from 'next/server';
import { BrandOperations } from '@/lib/db/postgres/operations/brand';

const isLocalDev = () => {
  return process.env.NODE_ENV !== 'production';
};

/**
 * POST /api/brand/wallet/recharge
 * Recharge brand wallet with specified amount
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, brandId, paymentMethod = 'card' } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid recharge amount', details: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    // Minimum recharge amount
    const MIN_RECHARGE = 1000;
    if (amount < MIN_RECHARGE) {
      return NextResponse.json(
        { 
          error: 'Amount too low', 
          details: `Minimum recharge amount is ₹${MIN_RECHARGE}` 
        },
        { status: 400 }
      );
    }

    // ── Update Internal DB Balance ───────────────────────────────
    let newBalance = 0;
    try {
      newBalance = await BrandOperations.rechargeWallet(brandId, amount);
    } catch (dbErr) {
      console.error('[Brand Wallet] ❌ DB update failed:', dbErr);
      // If brandId is invalid (demo brand not in DB yet), we can't update, 
      // but for the demo we'll let it pass if it's local dev
      if (!isLocalDev()) throw dbErr;
    }
    
    // ── Demo mode: Fake payment processing ──────────────────────────
    if (isLocalDev()) {
      console.log(`[Demo] Mock recharge for brand: ${brandId}, amount: ₹${amount}`);
      
      // Simulate payment gateway processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate fake transaction details
      const transactionId = `txn-recharge-${Date.now()}`;
      const orderId = `order-${Date.now()}`;
      
      return NextResponse.json({
        success: true,
        data: {
          transactionId,
          orderId,
          brandId,
          amount,
          newBalance,
          status: 'completed',
          paymentMethod,
          message: `Successfully recharged ₹${amount} to your brand wallet`,
          timestamp: new Date().toISOString(),
          // Fake payment gateway response
          gateway: {
            provider: 'Razorpay',
            paymentId: `pay_${Date.now()}`,
            signature: 'fake_signature_for_demo',
          },
        },
      });
    }
    // ── End demo mode ───────────────────────────────────────────────

    return NextResponse.json({
       success: true,
       data: {
         brandId,
         amount,
         newBalance,
         status: 'completed'
       }
    });

  } catch (error) {
    console.error('API Error in /api/brand/wallet/recharge:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/brand/wallet/recharge
 * Get recharge history for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    // ── Demo mode: Return mock recharge history ─────────────────────
    if (isLocalDev()) {
      const mockHistory = [
        {
          transactionId: 'txn-recharge-001',
          orderId: 'order-001',
          brandId,
          amount: 10000,
          status: 'completed',
          paymentMethod: 'card',
          timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          transactionId: 'txn-recharge-002',
          orderId: 'order-002',
          brandId,
          amount: 25000,
          status: 'completed',
          paymentMethod: 'upi',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          transactionId: 'txn-recharge-003',
          orderId: 'order-003',
          brandId,
          amount: 50000,
          status: 'completed',
          paymentMethod: 'card',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      return NextResponse.json({
        success: true,
        data: {
          brandId,
          transactions: mockHistory,
          totalRecharges: mockHistory.length,
          totalAmount: mockHistory.reduce((sum, t) => sum + t.amount, 0),
        },
      });
    }
    // ── End demo mode ───────────────────────────────────────────────

    // Production: Fetch from database
    return NextResponse.json(
      { error: 'Not implemented for production' },
      { status: 501 }
    );

  } catch (error) {
    console.error('API Error in /api/brand/wallet/recharge GET:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
