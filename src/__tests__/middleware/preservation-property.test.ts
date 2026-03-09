import { NextRequest, NextResponse } from 'next/server';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { createAccessToken } from '@/lib/auth/tokens';

/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 * 
 * **Property 2: Preservation** - Complete Middleware Functionality
 */

// Helper to run whatever middleware files currently exist, combining their effects.
// This allows the test to pass on both UNFIXED code (by combining the 3 files)
// and FIXED code (by just running the consolidated proxy.ts).
async function runMiddlewarePipeline(req: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next();
  const rootDir = path.resolve(__dirname, '../../..');
  
  // 1. Root middleware.ts uses security headers
  if (fs.existsSync(path.join(rootDir, 'middleware.ts'))) {
    const mod = require('../../../middleware');
    const res = await mod.middleware(req);
    if (res) {
      if (res.status === 204) { response = res; return response; }
      res.headers.forEach((v: string, k: string) => response.headers.set(k, v));
    }
  }
  
  // 2. src/middleware.ts uses CORS
  if (fs.existsSync(path.join(rootDir, 'src', 'middleware.ts'))) {
    // We must use dynamic require to avoid TypeScript compiler caching issues
    // or path aliases, but since it's commonjs, it's relative to the test file.
    const mod = require('../../middleware');
    const res = await mod.middleware(req);
    if (res) {
      if (res.status === 204) { 
        // options preflight
        res.headers.forEach((v: string, k: string) => response.headers.set(k, v));
        return res; 
      }
      res.headers.forEach((v: string, k: string) => response.headers.set(k, v));
    }
  }
  
  // 3. src/proxy.ts uses Auth
  if (fs.existsSync(path.join(rootDir, 'src', 'proxy.ts'))) {
    const mod = require('../../proxy');
    const fn = mod.proxy || mod.middleware;
    if (fn) {
      const res = fn(req);
      const awaitedRes = await res;
      if (awaitedRes) {
        if (awaitedRes.status === 401 || awaitedRes.status === 204) return awaitedRes; // Auth failure or OPTIONS preflight
        awaitedRes.headers.forEach((v: string, k: string) => response.headers.set(k, v));
      }
    }
  }
  
  return response;
}

const PUBLIC_ROUTES = [
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/verify',
  '/api/brand/auth',
  '/api/health',
];

describe('Preservation Property Tests - Middleware Functionality', () => {
  const baseUrl = 'http://localhost:3000';

  const createValidToken = async () =>
    createAccessToken({
      sub: 'test-shopkeeper-id',
      role: 'shopkeeper',
      name: 'Test Shopkeeper',
      phone_number: '+919876543210',
      email: 'test@example.com',
    });

  it('Property: Security headers are set on all responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter(s => /^[a-zA-Z0-9/-]+$/.test(s) && s.length > 0),
        async (pathname) => {
          const req = new NextRequest(`${baseUrl}/${pathname}`);
          const res = await runMiddlewarePipeline(req);
          
          expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
          expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
          expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
          expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('Property: Public API routes allow access without authentication', async () => {
    for (const route of PUBLIC_ROUTES) {
      const req = new NextRequest(`${baseUrl}${route}`);
      const res = await runMiddlewarePipeline(req);
      expect(res.status).toBe(200); // Should pass through without returning 401
    }
  });

  it('Property: Protected API routes reject unauthenticated requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter(s => /^[a-zA-Z0-9/-]+$/.test(s) && !PUBLIC_ROUTES.some(pr => `/${s}`.startsWith(pr))),
        async (pathSegment) => {
          // Explicitly testing a protected API route by prefixing with /api/
          // Also ensure it doesn't accidentally hit a public route
          const pathname = `/api/protected/${pathSegment}`;
          const req = new NextRequest(`${baseUrl}${pathname}`);
          const res = await runMiddlewarePipeline(req);
          
          expect(res.status).toBe(401);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('Property: Protected API routes allow authenticated requests (auth_token cookie)', async () => {
    const validToken = await createValidToken();
    const req = new NextRequest(`${baseUrl}/api/protected/data`);
    req.cookies.set('auth_token', validToken);
    const res = await runMiddlewarePipeline(req);
    expect(res.status).toBe(200);
  });

  it('Property: Protected API routes allow authenticated requests (Bearer token)', async () => {
    const validToken = await createValidToken();
    const req = new NextRequest(`${baseUrl}/api/protected/data`, {
      headers: new Headers({ 'Authorization': `Bearer ${validToken}` })
    });
    const res = await runMiddlewarePipeline(req);
    expect(res.status).toBe(200);
  });

  it('Property: Preflight OPTIONS requests return 204 with CORS headers', async () => {
    const req = new NextRequest(`${baseUrl}/api/data`, {
      method: 'OPTIONS',
      headers: new Headers({ 'Origin': 'http://localhost:3000' })
    });
    const res = await runMiddlewarePipeline(req);
    
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
  });

  it('Property: API Routes include CORS headers', async () => {
    const validToken = await createValidToken();
    const req = new NextRequest(`${baseUrl}/api/public-data`, {
      headers: new Headers({ 'Origin': 'http://localhost:3000' })
    });
    // This route is not in public routes so it requires auth, skipping auth for testing basic headers by providing it
    req.cookies.set('auth_token', validToken);
    const res = await runMiddlewarePipeline(req);
    
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
  });
});
