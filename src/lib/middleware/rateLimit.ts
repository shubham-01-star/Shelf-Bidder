/**
 * Rate Limiting Middleware
 * Protects API routes from abuse using in-memory token bucket algorithm
 * For production, consider using Redis for distributed rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier from request
 * Uses IP address or authenticated user ID
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get authenticated user from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const parts = token.split('.');
      if (parts.length >= 2) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        if (payload.sub) {
          return `user:${payload.sub}`;
        }
      }
    } catch {
      // Fall through to IP-based identification
    }
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return `ip:${ip}`;
}

/**
 * Rate limit middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const identifier = getClientIdentifier(request);
    const key = `${request.nextUrl.pathname}:${identifier}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
      return null; // Allow request
    }

    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: config.message || 'Rate limit exceeded. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      );
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    return null; // Allow request
  };
}

/**
 * Default rate limiters for different endpoint types
 */
export const rateLimiters = {
  // Authentication endpoints: 5 requests per minute
  auth: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again in a minute.',
  }),

  // General API endpoints: 100 requests per minute
  api: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'API rate limit exceeded. Please slow down your requests.',
  }),

  // File upload endpoints: 10 requests per minute
  upload: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Upload rate limit exceeded. Please wait before uploading more files.',
  }),

  // Strict rate limit for sensitive operations: 3 requests per minute
  strict: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 3,
    message: 'Too many requests. Please wait before trying again.',
  }),
};

/**
 * Apply rate limiting to an API route handler
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: (request: NextRequest) => Promise<NextResponse | null>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const limitResponse = await limiter(request);
    if (limitResponse) {
      return limitResponse;
    }

    // Proceed with handler
    return handler(request);
  };
}
