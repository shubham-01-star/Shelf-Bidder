/**
 * Profile Sync API Route
 * POST /api/profile/sync
 *
 * Creates or updates a shopkeeper record in PostgreSQL from the current signed-in user.
 * Useful when the shopkeeper record is missing or needs to be refreshed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { ShopkeeperOperations } from '@/lib/db/postgres/operations';

export async function POST(request: NextRequest) {
  try {
    console.log('[Profile Sync] Starting profile sync...');

    // Get shopkeeper ID from JWT token
    const shopkeeperId = await getShopkeeperIdFromRequest(request);
    console.log('[Profile Sync] Shopkeeper ID from token:', shopkeeperId);

    // Check if shopkeeper already exists in PostgreSQL
    let shopkeeper;
    try {
      shopkeeper = await ShopkeeperOperations.getByShopkeeperId(shopkeeperId);
      console.log('[Profile Sync] Shopkeeper exists, updating...');

      // Update existing record
      await ShopkeeperOperations.update(shopkeeper.id, {
        name: shopkeeper.name || 'Demo User',
        last_active_date: new Date(),
      });

      console.log('[Profile Sync] Shopkeeper updated successfully');

      return NextResponse.json({
        success: true,
        message: 'Profile sync verified',
        data: {
          shopkeeperId,
          name: shopkeeper.name,
          phoneNumber: shopkeeper.phone_number,
          email: shopkeeper.email,
          action: 'updated',
        },
      });
    } catch {
      console.log('[Profile Sync] Shopkeeper does not exist...');
      return NextResponse.json({
        success: false,
        message: 'Profile not found. Please sign up.',
      }, { status: 404 });
    }
  } catch (error) {
    console.error('[Profile Sync] Error:', error);

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to sync profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
