import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/auth/cookies';
import { getCookieDurations, isRole, issueAuthSession } from '@/lib/auth/session';
import { verifyRefreshToken } from '@/lib/auth/tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const refreshToken =
      body.refreshToken ||
      request.cookies.get('refresh_token')?.value ||
      request.cookies.get('brand_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Missing refresh token', message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    const claims = await verifyRefreshToken(refreshToken).catch(() => null);
    if (!claims) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    if (!isRole(claims.role)) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Refresh token role is invalid' },
        { status: 401 }
      );
    }

    const subject = claims.sub;
    if (!subject) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Refresh token subject is invalid' },
        { status: 401 }
      );
    }

    const session = await issueAuthSession({
      sub: subject,
      role: claims.role,
      name: claims.name,
      phone_number: claims.phone_number,
      email: claims.email,
    });

    const response = NextResponse.json(session);
    const { accessMaxAge, refreshMaxAge } = getCookieDurations();

    setAuthCookies(
      response,
      claims.role,
      session.accessToken,
      session.refreshToken,
      accessMaxAge,
      refreshMaxAge
    );

    return response;
  } catch (error: unknown) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during token refresh' },
      { status: 500 }
    );
  }
}
