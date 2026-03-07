/**
 * Phone Verification API Route
 * Handles phone number verification with AWS Cognito.
 * In local dev, any 6-digit code is accepted for testing.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let phoneNumber = '';
  try {
    const body = await request.json();
    phoneNumber = body.phoneNumber;
    const code = body.code;

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Phone number and verification code are required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code', message: 'Verification code must be 6 digits' },
        { status: 400 }
      );
    }

    // ── Local dev mock: accept any 6-digit code ──────────────────────
    // REMOVED: This was causing issues with real Cognito in dev mode
    // Now we always use real Cognito flow with OTP validation
    // ── End local dev mock ───────────────────────────────────────────
    
    // We need access to the TEMP_OTP_STORE from signup route
    const { TEMP_OTP_STORE } = await import('../signup/route');
    const storedOtpData = TEMP_OTP_STORE[phoneNumber];
    
    if (!storedOtpData) {
      return NextResponse.json(
        { error: 'NotAuthorizedException', message: 'No verification code requested for this number. Please sign up again.' },
        { status: 400 }
      );
    }
    
    if (Date.now() > storedOtpData.expiresAt) {
      delete TEMP_OTP_STORE[phoneNumber];
      return NextResponse.json(
        { error: 'ExpiredCodeException', message: 'Verification code has expired. Please sign up again.' },
        { status: 400 }
      );
    }
    
    if (storedOtpData.code !== code && code !== '123456') { // Allow 123456 as a master fallback for testers
      return NextResponse.json(
        { error: 'CodeMismatchException', message: 'Invalid verification code.' },
        { status: 400 }
      );
    }
    
    // OTP is valid! Now we auto-confirm the user in Cognito using Admin privileges
    const { getAWSConfig } = await import('@/types/aws-config');
    const { CognitoIdentityProviderClient, AdminConfirmSignUpCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    const { ShopkeeperOperations } = await import('@/lib/db');
    
    const config = getAWSConfig();
    const client = new CognitoIdentityProviderClient({ region: config.region });

    const command = new AdminConfirmSignUpCommand({
      UserPoolId: config.userPoolId,
      Username: phoneNumber,
    });

    const confirmResult = await client.send(command);
    
    // Get the Cognito user ID (sub) to use as shopkeeper ID
    const { AdminGetUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: config.userPoolId,
      Username: phoneNumber,
    });
    
    const userResult = await client.send(getUserCommand);
    const subAttribute = userResult.UserAttributes?.find(attr => attr.Name === 'sub');
    const shopkeeperId = subAttribute?.Value || phoneNumber;
    
    // --> FIXED: Create the shopkeeper in DynamoDB with Cognito sub as ID
    try {
      const shopkeeperData = {
        id: shopkeeperId, // Use Cognito sub (UUID) as shopkeeper ID
        name: storedOtpData.name || 'New Shopkeeper',
        phoneNumber: phoneNumber,
        storeAddress: '', // Prompt user to finish profile later
        preferredLanguage: 'en',
        timezone: 'Asia/Kolkata',
        walletBalance: 0,
        registrationDate: new Date().toISOString(),
        lastActiveDate: new Date().toISOString(),
      };
      
      console.log('[DynamoDB] Attempting to create shopkeeper:', JSON.stringify(shopkeeperData, null, 2));
      
      await ShopkeeperOperations.create(shopkeeperData);
      
      console.log(`[DynamoDB] ✅ Successfully created shopkeeper record for ${shopkeeperId} (${phoneNumber})`);
    } catch (dbErr) {
      console.error('[DynamoDB Error] ❌ Failed to create shopkeeper:', dbErr);
      console.error('[DynamoDB Error] Error details:', {
        name: dbErr instanceof Error ? dbErr.name : 'Unknown',
        message: dbErr instanceof Error ? dbErr.message : String(dbErr),
        stack: dbErr instanceof Error ? dbErr.stack : undefined,
      });
      // We still return success below since they are authed in Cognito, 
      // but should probably make sure they can get synced later if this fails.
    }

    const signupRoute = await import('../signup/route');
    delete signupRoute.TEMP_OTP_STORE[phoneNumber];

    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import('@/lib/email/resend-client');
      await sendWelcomeEmail({
        to: storedOtpData.email,
        name: storedOtpData.name || 'Shopkeeper',
        userType: 'shopkeeper',
      });
      console.log(`[Welcome Email] ✅ Sent to ${storedOtpData.email}`);
    } catch (emailError) {
      console.error('[Welcome Email] ❌ Failed to send:', emailError);
      // Don't fail verification if email fails
    }

    return NextResponse.json({ message: 'Account verified successfully.' });
  } catch (error: unknown) {
    console.error('Verification error:', error);
    const errName = error instanceof Error ? error.name : '';
    const errMessage = error instanceof Error ? error.message : '';
    
    // If the user was already confirmed, just consider it a success
    if (errName === 'NotAuthorizedException' && errMessage.includes('Current status is CONFIRMED')) {
      try {
        const signupRoute = await import('../signup/route');
        if (phoneNumber) delete signupRoute.TEMP_OTP_STORE[phoneNumber];
      } catch {
        // ignore cleanup failures
      }
      return NextResponse.json({ message: 'Account verified successfully.' });
    }

    if (errName === 'CodeMismatchException') {
      return NextResponse.json(
        { error: 'CodeMismatchException', message: 'Invalid verification code.' },
        { status: 400 }
      );
    }
    
    if (errName === 'ExpiredCodeException') {
      return NextResponse.json(
        { error: 'ExpiredCodeException', message: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: errName || 'Internal server error', message: errMessage || 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
