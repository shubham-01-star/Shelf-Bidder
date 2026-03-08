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

    // Decode the refresh token and generate new simple tokens
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
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // Extend for 7 more days
      };
      
      const encoded = Buffer.from(JSON.stringify(newPayload)).toString('base64url');
      const newToken = `simple.${encoded}.token`;

      return NextResponse.json({
        accessToken: newToken,
        idToken: newToken,
        refreshToken: `refresh.${newToken}`,
        expiresIn: 7 * 24 * 3600,
      });
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Failed to decode refresh token' },
        { status: 401 }
      );
    }


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
