/**
 * Token Refresh API Route
 * Handles JWT token refresh with AWS Cognito
 * Implements refresh token rotation for enhanced security
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    // Validate input
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Missing refresh token', message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // ── Local dev mock refresh ──────────────────────────────────────
    const isLocalDev = process.env.NODE_ENV !== 'production';
    const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || '';
    const isPlaceholderPool = userPoolId.includes('localDev') || userPoolId === '';

    if (isLocalDev && isPlaceholderPool) {
      // In local dev, decode the refresh token and generate new tokens
      try {
        const tokenParts = refreshToken.split('.');
        if (tokenParts.length < 2) {
          return NextResponse.json(
            { error: 'Invalid token', message: 'Malformed refresh token' },
            { status: 401 }
          );
        }

        // Decode the payload
        const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
        const payload = JSON.parse(Buffer.from(padded, 'base64').toString());

        // Generate new tokens
        const newPayload = {
          ...payload,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        };
        const encoded = Buffer.from(JSON.stringify(newPayload)).toString('base64url');
        const newToken = `local.${encoded}.local`;

        return NextResponse.json({
          accessToken: newToken,
          idToken: newToken,
          refreshToken: `refresh.${newToken}`,
          expiresIn: 3600,
        });
      } catch (err) {
        return NextResponse.json(
          { error: 'Invalid token', message: 'Failed to decode refresh token' },
          { status: 401 }
        );
      }
    }
    // ── End local dev mock ───────────────────────────────────────────

    // Real AWS Cognito Token Refresh with Rotation
    const { getAWSConfig } = await import('@/types/aws-config');
    const { CognitoIdentityProviderClient, InitiateAuthCommand } = await import('@aws-sdk/client-cognito-identity-provider');

    const config = getAWSConfig();
    const client = new CognitoIdentityProviderClient({ region: config.region });

    // Use REFRESH_TOKEN_AUTH flow
    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: config.userPoolClientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      return NextResponse.json(
        { error: 'Token refresh failed', message: 'Failed to refresh authentication tokens' },
        { status: 401 }
      );
    }

    // Cognito returns new access and ID tokens
    // The refresh token may be rotated (new one provided) or remain the same
    const result = response.AuthenticationResult;

    return NextResponse.json({
      accessToken: result.AccessToken,
      idToken: result.IdToken,
      // Use new refresh token if provided (rotation), otherwise keep the old one
      refreshToken: result.RefreshToken || refreshToken,
      expiresIn: result.ExpiresIn || 3600,
    });
  } catch (error: unknown) {
    console.error('Token refresh error:', error);

    const errName = error instanceof Error ? error.name : '';
    const errMessage = error instanceof Error ? error.message : 'An error occurred during token refresh';

    if (errName === 'NotAuthorizedException') {
      return NextResponse.json(
        { error: 'NotAuthorizedException', message: 'Invalid or expired refresh token. Please sign in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: errName || 'Internal server error', message: errMessage },
      { status: 500 }
    );
  }
}
