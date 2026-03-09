import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { requestPayout } from '@/lib/wallet/wallet-service';

export async function POST(request: NextRequest) {
  try {
    const shopkeeperId = await getShopkeeperIdFromRequest(request);
    
    // Parse request body
    const body = await request.json();
    const amount = body?.amount;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Valid payout amount is required' }, { status: 400 });
    }

    // Call wallet service to handle payout
    const transaction = await requestPayout(shopkeeperId, amount);

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AuthenticationError') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      
      // Handle known service errors
      if (
        error.message.includes('Insufficient balance') || 
        error.message.includes('maximum limit') ||
        error.message.includes('threshold')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    console.error('API Error in /api/wallet/payout:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
