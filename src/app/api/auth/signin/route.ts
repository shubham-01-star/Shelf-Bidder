/**
 * Sign In API Route
 * Handles shopkeeper authentication with AWS Cognito.
 * In local dev (no real Cognito), uses mock auth for testing.
 */

import { NextRequest, NextResponse } from 'next/server';

// ---- Mock user store for local development ----
// In production this is replaced by real Cognito calls.
// Registered via /api/auth/signup, stored in-memory (resets on server restart).
const LOCAL_DEV_USERS: Record<string, { name: string; password: string }> = {
  // Pre-seeded sample user for easy testing
  '+919876543210': { name: 'Ramesh Kumar', password: 'Test@1234' },
};

// Expose the store so signup route can add users
export { LOCAL_DEV_USERS };

function makeLocalToken(phoneNumber: string, name: string): string {
  // Fake JWT-shaped token (base64 payload) for local dev
  const payload = {
    sub: `local-${phoneNumber.replace(/\D/g, '')}`,
    phone_number: phoneNumber,
    name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `local.${encoded}.local`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, password } = body;

    if (!phoneNumber || !password) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Phone number and password are required' },
        { status: 400 }
      );
    }

    // ── Local dev mock auth ──────────────────────────────────────────
    const isLocalDev = process.env.NODE_ENV !== 'production';
    const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || '';
    const isPlaceholderPool = userPoolId.includes('localDev') || userPoolId === '';

    if (isLocalDev && isPlaceholderPool) {
      const user = LOCAL_DEV_USERS[phoneNumber];
      if (!user) {
        return NextResponse.json(
          { error: 'UserNotFoundException', message: 'No account found with this phone number. Please sign up first.' },
          { status: 401 }
        );
      }
      if (user.password !== password) {
        return NextResponse.json(
          { error: 'NotAuthorizedException', message: 'Incorrect password. Please try again.' },
          { status: 401 }
        );
      }

      const token = makeLocalToken(phoneNumber, user.name);
      return NextResponse.json({
        accessToken: token,
        idToken: token,
        refreshToken: `refresh.${token}`,
        expiresIn: 3600,
        name: user.name,
        phoneNumber,
      });
    }
    // ── End local dev mock ───────────────────────────────────────────

    // Real AWS Cognito Authentication
    const { getAWSConfig } = await import('@/types/aws-config');
    const { CognitoIdentityProviderClient, InitiateAuthCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    
    const config = getAWSConfig();
    const client = new CognitoIdentityProviderClient({ region: config.region });

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: config.userPoolClientId,
      AuthParameters: {
        USERNAME: phoneNumber,
        PASSWORD: password,
      },
    });

    const authResponse = await client.send(command);

    if (authResponse.AuthenticationResult) {
      return NextResponse.json({
        accessToken: authResponse.AuthenticationResult.AccessToken,
        idToken: authResponse.AuthenticationResult.IdToken,
        refreshToken: authResponse.AuthenticationResult.RefreshToken,
        expiresIn: authResponse.AuthenticationResult.ExpiresIn,
      });
    }

    return NextResponse.json(
      { error: 'NotAuthorizedException', message: 'Authentication failed. Please check your credentials.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Sign in error:', error);

    if (error.name === 'NotAuthorizedException') {
      return NextResponse.json(
        { error: 'NotAuthorizedException', message: 'Incorrect phone number or password.' },
        { status: 401 }
      );
    }
    
    if (error.name === 'UserNotFoundException') {
      return NextResponse.json(
        { error: 'UserNotFoundException', message: 'Account not found. Please sign up first.' },
        { status: 404 }
      );
    }
    
    if (error.name === 'UserNotConfirmedException') {
      return NextResponse.json(
        { error: 'UserNotConfirmedException', message: 'Please verify your phone number first.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during sign in' },
      { status: 500 }
    );
  }
}
