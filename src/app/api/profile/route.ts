/**
 * Profile API - Update shopkeeper profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { ShopkeeperOperations } from '@/lib/db/postgres/operations';

/**
 * GET /api/profile - Get shopkeeper profile
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Profile GET] 🔍 Starting profile GET...');
    
    const shopkeeperId = getShopkeeperIdFromRequest(request);
    console.log('[Profile GET] 📝 Shopkeeper ID from token:', shopkeeperId);

    if (!shopkeeperId) {
      console.log('[Profile GET] ❌ No shopkeeper ID found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Profile GET] 📞 Calling ShopkeeperOperations.getByShopkeeperId...');
    const shopkeeper = await ShopkeeperOperations.getByShopkeeperId(shopkeeperId);
    console.log('[Profile GET] ✅ Got shopkeeper:', shopkeeper);

    return NextResponse.json({
      success: true,
      data: shopkeeper,
    });
  } catch (error) {
    console.error('[Profile GET] ❌ Error:', error);
    console.error('[Profile GET] ❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[Profile GET] ❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get profile',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile - Update shopkeeper profile
 */
export async function PATCH(request: NextRequest) {
  try {
    console.log('[Profile PATCH] 🔍 Starting profile update...');
    console.log('[Profile PATCH] 📋 Headers:', Object.fromEntries(request.headers.entries()));
    
    const shopkeeperId = getShopkeeperIdFromRequest(request);
    console.log('[Profile PATCH] 📝 Shopkeeper ID from token:', shopkeeperId);

    if (!shopkeeperId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[Profile PATCH] 📦 Request body:', body);
    const { name, storeAddress, preferredLanguage, timezone } = body;

    // Validate input
    const updates: any = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: 'Name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (storeAddress !== undefined) {
      if (typeof storeAddress !== 'string' || storeAddress.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: 'Store address must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.storeAddress = storeAddress.trim();
    }

    if (preferredLanguage !== undefined) {
      const validLanguages = ['hi', 'en', 'ta', 'te', 'bn', 'mr', 'gu'];
      if (!validLanguages.includes(preferredLanguage)) {
        return NextResponse.json(
          { success: false, message: 'Invalid language code' },
          { status: 400 }
        );
      }
      updates.preferredLanguage = preferredLanguage;
    }

    if (timezone !== undefined) {
      if (typeof timezone !== 'string') {
        return NextResponse.json(
          { success: false, message: 'Timezone must be a string' },
          { status: 400 }
        );
      }
      updates.timezone = timezone;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update last active date
    updates.last_active_date = new Date();

    // Get shopkeeper UUID first, then update
    const shopkeeper = await ShopkeeperOperations.getByShopkeeperId(shopkeeperId);
    const updatedShopkeeper = await ShopkeeperOperations.update(shopkeeper.id, updates);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedShopkeeper,
    });
  } catch (error) {
    console.error('[Profile PATCH] ❌ Update profile error:', error);
    console.error('[Profile PATCH] ❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
    
    // Check if it's an authentication error
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}
