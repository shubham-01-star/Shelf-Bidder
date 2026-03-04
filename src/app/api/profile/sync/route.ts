/**
 * Profile Sync API Route
 * POST /api/profile/sync
 * 
 * Creates or updates shopkeeper record in DynamoDB from Cognito user data.
 * Useful when shopkeeper record is missing or needs to be synced.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { ShopkeeperOperations } from '@/lib/db';
import { getAWSConfig } from '@/types/aws-config';
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

export async function POST(request: NextRequest) {
  try {
    console.log('[Profile Sync] 🔄 Starting profile sync...');
    
    // Get shopkeeper ID from JWT token
    const shopkeeperId = getShopkeeperIdFromRequest(request);
    console.log('[Profile Sync] 📝 Shopkeeper ID from token:', shopkeeperId);
    
    // Get user details from Cognito
    const config = getAWSConfig();
    console.log('[Profile Sync] ⚙️ AWS Config:', { region: config.region, userPoolId: config.userPoolId });
    
    const client = new CognitoIdentityProviderClient({ region: config.region });
    
    const command = new AdminGetUserCommand({
      UserPoolId: config.userPoolId,
      Username: shopkeeperId,
    });
    
    console.log('[Profile Sync] 🔍 Fetching user from Cognito...');
    const userResult = await client.send(command);
    console.log('[Profile Sync] ✅ Got user from Cognito');
    
    // Extract user attributes
    const attributes = userResult.UserAttributes || [];
    const getName = (name: string) => attributes.find(attr => attr.Name === name)?.Value || '';
    
    const name = getName('name') || 'Shopkeeper';
    const phoneNumber = getName('phone_number') || '';
    const email = getName('email') || '';
    
    console.log('[Profile Sync] 👤 User details:', { name, phoneNumber, email });
    
    console.log('[Profile Sync] 👤 User details:', { name, phoneNumber, email });
    
    // Check if shopkeeper already exists
    let shopkeeper;
    try {
      console.log('[Profile Sync] 🔍 Checking if shopkeeper exists in DynamoDB...');
      shopkeeper = await ShopkeeperOperations.get(shopkeeperId);
      console.log('[Profile Sync] ✅ Shopkeeper exists, updating...');
      
      // Update existing record
      await ShopkeeperOperations.update(shopkeeperId, {
        name,
        phoneNumber,
        lastActiveDate: new Date().toISOString(),
      });
      
      console.log('[Profile Sync] ✅ Shopkeeper updated successfully');
      
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
    } catch (error) {
      console.log('[Profile Sync] ℹ️ Shopkeeper does not exist, creating new...');
      console.log('[Profile Sync] Error from get:', error instanceof Error ? error.message : String(error));
      
      // Shopkeeper doesn't exist, create new record
      console.log(`[Profile Sync] 📝 Creating new shopkeeper record for ${shopkeeperId}`);
      
      try {
        // Use direct PutCommand without condition to allow upsert
        const { ShopkeeperMapper } = await import('@/lib/db/mappers');
        const { dynamoDBClient } = await import('@/lib/db/client');
        const { TABLE_NAMES } = await import('@/lib/db/types');
        const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
        
        console.log('[Profile Sync] 📦 Preparing shopkeeper data...');
        
        const shopkeeperData = {
          id: shopkeeperId,
          name,
          phoneNumber,
          storeAddress: '',
          preferredLanguage: 'en',
          timezone: 'Asia/Kolkata',
          walletBalance: 0,
          registrationDate: new Date().toISOString(),
          lastActiveDate: new Date().toISOString(),
        };
        
        console.log('[Profile Sync] 📦 Shopkeeper data:', JSON.stringify(shopkeeperData, null, 2));
        
        const item = ShopkeeperMapper.toItem(shopkeeperData);
        console.log('[Profile Sync] 🗂️ Mapped DynamoDB item:', JSON.stringify(item, null, 2));
        
        console.log('[Profile Sync] 💾 Sending PutCommand to DynamoDB...');
        console.log('[Profile Sync] 📍 Table name:', TABLE_NAMES.SHOPKEEPERS);
        
        await dynamoDBClient.send(
          new PutCommand({
            TableName: TABLE_NAMES.SHOPKEEPERS,
            Item: item,
            // No ConditionExpression - allow overwrite for sync
          })
        );
        
        console.log('[Profile Sync] ✅ Successfully created shopkeeper in DynamoDB!');
        
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
        console.error('[Profile Sync] ❌ Failed to create shopkeeper:', createError);
        console.error('[Profile Sync] ❌ Error details:', {
          name: createError instanceof Error ? createError.name : 'Unknown',
          message: createError instanceof Error ? createError.message : String(createError),
          stack: createError instanceof Error ? createError.stack : undefined,
        });
        throw createError;
      }
    }
  } catch (error) {
    console.error('[Profile Sync] ❌ Top-level error:', error);
    console.error('[Profile Sync] ❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[Profile Sync] ❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
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
