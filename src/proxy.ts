import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- CORS Configuration ---
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://shelf-bidder.vercel.app',
  'https://www.shelf-bidder.com',
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  if (process.env.NODE_ENV === 'development') {
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  }
  return ALLOWED_ORIGINS.includes(origin);
}

function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// --- Security Headers Configuration ---
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=*, geolocation=*, microphone=*');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.amazonaws.com; frame-ancestors 'self';"
    );
  }
  return response;
}

// --- Auth Configuration ---
const PUBLIC_API_ROUTES = [
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/verify',
  '/api/brand/auth',
  '/api/health',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // 1. Handle preflight OPTIONS requests immediately
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    addCorsHeaders(response, origin);
    addSecurityHeaders(response);
    return response;
  }

  // 2. Authentication Check for API routes
  let response = NextResponse.next();
  let authErrorResponse: NextResponse | null = null;
  
  if (pathname.startsWith('/api') && !PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const cookieToken = request.cookies.get('auth_token');
      if (!cookieToken) {
        authErrorResponse = NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }
    }
  }

  // If unauthorized, prepare the 401 response instead of next()
  if (authErrorResponse) {
    response = authErrorResponse;
  }

  // 3. Add CORS headers (for all API routes)
  if (pathname.startsWith('/api')) {
    addCorsHeaders(response, origin);
  }

  // 4. Add security headers (to all responses)
  addSecurityHeaders(response);

  return response;
}

// NextJS expects middleware or proxy depending on the version. We export both.
export { proxy as middleware };

// Run middleware on these routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox.*|icon.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
