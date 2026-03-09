/**
 * Rate Limiting Tests
 * Tests rate limiting middleware functionality
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createRateLimiter } from '@/lib/middleware/rateLimit';

describe('Rate Limiting Middleware', () => {
  describe('createRateLimiter', () => {
    it('should allow requests within rate limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // First request should be allowed
      const response1 = await limiter(request);
      expect(response1).toBeNull();

      // Second request should be allowed
      const response2 = await limiter(request);
      expect(response2).toBeNull();
    });

    it('should block requests exceeding rate limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        message: 'Rate limit exceeded',
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });

      // First two requests should be allowed
      await limiter(request);
      await limiter(request);

      // Third request should be blocked
      const response = await limiter(request);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);

      const data = await response?.json();
      expect(data.error).toBe('Too Many Requests');
      expect(data.retryAfter).toBeGreaterThan(0);
    });

    it('should include rate limit headers in response', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });

      // First request allowed
      await limiter(request);

      // Second request blocked
      const response = await limiter(request);
      expect(response).not.toBeNull();

      const headers = response?.headers;
      expect(headers?.get('Retry-After')).toBeDefined();
      expect(headers?.get('X-RateLimit-Limit')).toBe('1');
      expect(headers?.get('X-RateLimit-Remaining')).toBe('0');
      expect(headers?.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should reset counter after time window', async () => {
      const limiter = createRateLimiter({
        windowMs: 100, // 100ms window for testing
        maxRequests: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.4' },
      });

      // First request allowed
      const response1 = await limiter(request);
      expect(response1).toBeNull();

      // Second request blocked
      const response2 = await limiter(request);
      expect(response2?.status).toBe(429);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Third request should be allowed (new window)
      const response3 = await limiter(request);
      expect(response3).toBeNull();
    });

    it('should track different IPs separately', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
      });

      const request1 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.5' },
      });

      const request2 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.6' },
      });

      // First request from IP1 allowed
      const response1 = await limiter(request1);
      expect(response1).toBeNull();

      // First request from IP2 allowed (different IP)
      const response2 = await limiter(request2);
      expect(response2).toBeNull();

      // Second request from IP1 blocked
      const response3 = await limiter(request1);
      expect(response3?.status).toBe(429);

      // Second request from IP2 blocked
      const response4 = await limiter(request2);
      expect(response4?.status).toBe(429);
    });

    it('should use authenticated user ID when available', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
      });

      // Create a mock JWT token
      const mockPayload = { sub: 'user-123' };
      const encoded = Buffer.from(JSON.stringify(mockPayload)).toString('base64url');
      const mockToken = `header.${encoded}.signature`;

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': `Bearer ${mockToken}`,
          'x-forwarded-for': '192.168.1.7',
        },
      });

      // First request allowed
      const response1 = await limiter(request);
      expect(response1).toBeNull();

      // Second request blocked (same user)
      const response2 = await limiter(request);
      expect(response2?.status).toBe(429);
    });
  });

  describe('Rate Limiter Presets', () => {
    it('should have auth rate limiter with strict limits', () => {
      const { rateLimiters } = require('@/lib/middleware/rateLimit');
      expect(rateLimiters.auth).toBeDefined();
    });

    it('should have api rate limiter with moderate limits', () => {
      const { rateLimiters } = require('@/lib/middleware/rateLimit');
      expect(rateLimiters.api).toBeDefined();
    });

    it('should have upload rate limiter with low limits', () => {
      const { rateLimiters } = require('@/lib/middleware/rateLimit');
      expect(rateLimiters.upload).toBeDefined();
    });

    it('should have strict rate limiter with very low limits', () => {
      const { rateLimiters } = require('@/lib/middleware/rateLimit');
      expect(rateLimiters.strict).toBeDefined();
    });
  });
});
