/**
 * Next.js Middleware for Authentication
 * Protects routes and handles authentication at the edge
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/signin', '/signup', '/verify', '/', '/dashboard', '/camera', '/tasks', '/wallet'];

// API routes that don't require authentication
const PUBLIC_API_ROUTES = ['/api/auth/signin', '/api/auth/signup', '/api/auth/verify'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for authentication token in cookies
  const authToken = request.cookies.get('auth_token');

  // Redirect to sign-in if no token found for protected routes
  if (!authToken && !pathname.startsWith('/api')) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // For API routes, return 401 if not authenticated
  if (!authToken && pathname.startsWith('/api')) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
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
     * - public folder
     * - sw.js (service worker)
     * - workbox files
     */
    '/((?!_next/static|_next/image|favicon.ico|public|sw.js|workbox).*)',
  ],
};
