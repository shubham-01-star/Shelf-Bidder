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

    // TODO (Production): Use AWS Cognito SDK here
    return NextResponse.json(
      { error: 'Not implemented', message: 'AWS Cognito integration pending.' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
