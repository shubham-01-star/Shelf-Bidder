/**
 * Profile API - Update shopkeeper profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { ShopkeeperOperations } from '@/lib/db/operations';

/**
 * GET /api/profile - Get shopkeeper profile
 */
export async function GET(request: NextRequest) {
  try {
    const shopkeeperId = getShopkeeperIdFromRequest(request);

    if (!shopkeeperId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const shopkeeper = await ShopkeeperOperations.get(shopkeeperId);

    return NextResponse.json({
      success: true,
      data: shopkeeper,
    });
  } catch (error) {
    console.error('Get profile error:', error);
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
    const shopkeeperId = getShopkeeperIdFromRequest(request);

    if (!shopkeeperId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
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
    updates.lastActiveDate = new Date().toISOString();

    // Update shopkeeper
    const updatedShopkeeper = await ShopkeeperOperations.update(shopkeeperId, updates);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedShopkeeper,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}
