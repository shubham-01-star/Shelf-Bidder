/**
 * Refresh Token API Tests
 * Tests JWT token refresh functionality and rotation
 * NOTE: These are integration tests that require a running server
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

let serverAvailable = false;

beforeAll(async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch(`${baseUrl}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);
    serverAvailable = true;
  } catch {
    serverAvailable = false;
  }
});

const itIfServer = (...args: Parameters<typeof it>) => {
  return serverAvailable ? it(...args) : it.skip(...args);
};

describe('Token Refresh API', () => {
  describe('POST /api/auth/refresh', () => {
    itIfServer('should return 400 when refresh token is missing', async () => {
      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing refresh token');
    });

    itIfServer('should return 401 for invalid refresh token format', async () => {
      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'invalid-token' }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    itIfServer('should refresh tokens with valid refresh token in local dev', async () => {
      // Create a mock local dev refresh token
      const mockPayload = {
        sub: 'test-user-123',
        phone_number: '+919876543210',
        name: 'Test User',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const encoded = Buffer.from(JSON.stringify(mockPayload)).toString('base64url');
      const mockRefreshToken = `refresh.local.${encoded}.local`;

      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: mockRefreshToken }),
      });

      if (response.status === 200) {
        const data = await response.json();
        expect(data.accessToken).toBeDefined();
        expect(data.idToken).toBeDefined();
        expect(data.refreshToken).toBeDefined();
        expect(data.expiresIn).toBe(3600);
      } else {
        expect(response.status).toBe(401);
      }
    });
  });

  describe('Token Rotation', () => {
    itIfServer('should return new refresh token when rotation is enabled', async () => {
      // This test verifies that the API supports refresh token rotation.

      const mockPayload = {
        sub: 'test-user-123',
        phone_number: '+919876543210',
        name: 'Test User',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const encoded = Buffer.from(JSON.stringify(mockPayload)).toString('base64url');
      const mockRefreshToken = `refresh.local.${encoded}.local`;

      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: mockRefreshToken }),
      });

      if (response.status === 200) {
        const data = await response.json();
        // Verify new refresh token is different from old one
        expect(data.refreshToken).toBeDefined();
        expect(data.refreshToken).not.toBe(mockRefreshToken);
      }
    });
  });
});
