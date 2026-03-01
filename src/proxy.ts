/**
 * Next.js Middleware for Authentication
 * 
 * IMPORTANT: Browser pages use client-side auth via localStorage (AuthContext).
 * This middleware only protects API routes at the edge.
 * Page-level route protection is handled client-side by each protected page.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// API routes that are public (no auth required)
const PUBLIC_API_ROUTES = [
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/verify',
  '/api/brand/auth',
  '/api/health',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all static files & non-API routes (client-side auth handles page protection)
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For protected API routes: check Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Also check auth_token cookie as fallback
    const cookieToken = request.cookies.get('auth_token');
    if (!cookieToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (manifest.json, icons, etc.)
     * - sw.js (service worker)
     * - workbox files
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon|sw.js|workbox).*)',
  ],
};
