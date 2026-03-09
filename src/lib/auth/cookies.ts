import { NextResponse } from 'next/server';
import type { AuthRole } from './tokens';

type CookieNames = {
  access: string;
  refresh: string;
};

function getCookieNames(role: AuthRole): CookieNames {
  if (role === 'brand') {
    return {
      access: 'brand_auth_token',
      refresh: 'brand_refresh_token',
    };
  }

  return {
    access: 'auth_token',
    refresh: 'refresh_token',
  };
}

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function setAuthCookies(
  response: NextResponse,
  role: AuthRole,
  accessToken: string,
  refreshToken: string,
  accessMaxAge: number,
  refreshMaxAge: number
): void {
  const cookieNames = getCookieNames(role);
  const common = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isSecureCookie(),
    path: '/',
  };

  response.cookies.set(cookieNames.access, accessToken, {
    ...common,
    maxAge: accessMaxAge,
  });
  response.cookies.set(cookieNames.refresh, refreshToken, {
    ...common,
    maxAge: refreshMaxAge,
  });
}

export function clearAuthCookies(response: NextResponse, role?: AuthRole): void {
  const cookieGroups = role ? [getCookieNames(role)] : [getCookieNames('shopkeeper'), getCookieNames('brand')];

  for (const cookieNames of cookieGroups) {
    response.cookies.set(cookieNames.access, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureCookie(),
      path: '/',
      maxAge: 0,
    });
    response.cookies.set(cookieNames.refresh, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureCookie(),
      path: '/',
      maxAge: 0,
    });
  }
}
