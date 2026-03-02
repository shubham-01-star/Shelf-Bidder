/**
 * Phone Verification API Route
 * Handles phone number verification with AWS Cognito.
 * In local dev, any 6-digit code is accepted for testing.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, code } = body;

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
    const isLocalDev = process.env.NODE_ENV !== 'production';
    const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || '';
    const isPlaceholderPool = userPoolId.includes('localDev') || userPoolId === '';

    if (isLocalDev && isPlaceholderPool) {
      console.log(`[Local Dev] Phone verified for: ${phoneNumber} with code: ${code}`);
      return NextResponse.json({ message: 'Phone number verified successfully.' });
    }
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
    
    const config = getAWSConfig();
    const client = new CognitoIdentityProviderClient({ region: config.region });

    const command = new AdminConfirmSignUpCommand({
      UserPoolId: config.userPoolId,
      Username: phoneNumber,
    });

    await client.send(command);
    
    // Cleanup OTP
    delete TEMP_OTP_STORE[phoneNumber];

    return NextResponse.json({ message: 'Account verified successfully.' });
  } catch (error: any) {
    console.error('Verification error:', error);
    
    if (error.name === 'CodeMismatchException') {
      return NextResponse.json(
        { error: 'CodeMismatchException', message: 'Invalid verification code.' },
        { status: 400 }
      );
    }
    
    if (error.name === 'ExpiredCodeException') {
      return NextResponse.json(
        { error: 'ExpiredCodeException', message: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
