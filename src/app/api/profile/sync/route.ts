/**
 * Profile Sync API Route
 * POST /api/profile/sync
 *
 * Creates or updates shopkeeper record in PostgreSQL from Cognito user data.
 * Useful when shopkeeper record is missing or needs to be synced.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { ShopkeeperOperations } from '@/lib/db/postgres/operations';
import { getAWSConfig } from '@/types/aws-config';
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

export async function POST(request: NextRequest) {
  try {
    console.log('[Profile Sync] Starting profile sync...');

    // Get shopkeeper ID from JWT token
    const shopkeeperId = getShopkeeperIdFromRequest(request);
    console.log('[Profile Sync] Shopkeeper ID from token:', shopkeeperId);

    // Get user details from Cognito
    const config = getAWSConfig();
    const client = new CognitoIdentityProviderClient({ region: config.region });

    const command = new AdminGetUserCommand({
      UserPoolId: config.userPoolId,
      Username: shopkeeperId,
    });

    console.log('[Profile Sync] Fetching user from Cognito...');
    const userResult = await client.send(command);

    // Extract user attributes
    const attributes = userResult.UserAttributes || [];
    const getName = (name: string) => attributes.find(attr => attr.Name === name)?.Value || '';

    const name = getName('name') || 'Shopkeeper';
    const phoneNumber = getName('phone_number') || '';
    const email = getName('email') || '';

    console.log('[Profile Sync] User details:', { name, phoneNumber, email });

    // Check if shopkeeper already exists in PostgreSQL
    let shopkeeper;
    try {
      shopkeeper = await ShopkeeperOperations.getByShopkeeperId(shopkeeperId);
      console.log('[Profile Sync] Shopkeeper exists, updating...');

      // Update existing record
      await ShopkeeperOperations.update(shopkeeper.id, {
        name,
        last_active_date: new Date(),
      });

      console.log('[Profile Sync] Shopkeeper updated successfully');

      return NextResponse.json({
        success: true,
        message: 'Profile synced successfully',
        data: {
          shopkeeperId,
          name,
          phoneNumber,
          email,
          action: 'updated',
        },
      });
    } catch {
      console.log('[Profile Sync] Shopkeeper does not exist, creating new...');

      // Create new shopkeeper record in PostgreSQL
      try {
        await ShopkeeperOperations.create({
          shopkeeper_id: shopkeeperId,
          name,
          phone_number: phoneNumber,
          email,
          store_address: '',
          preferred_language: 'en',
          timezone: 'Asia/Kolkata',
        });

        console.log('[Profile Sync] Successfully created shopkeeper in PostgreSQL');

        return NextResponse.json({
          success: true,
          message: 'Profile created successfully',
          data: {
            shopkeeperId,
            name,
            phoneNumber,
            email,
            action: 'created',
          },
        }, { status: 201 });
      } catch (createError) {
        console.error('[Profile Sync] Failed to create shopkeeper:', createError);
        throw createError;
      }
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
