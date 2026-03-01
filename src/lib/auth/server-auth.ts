import { NextRequest } from 'next/server';

export class AuthenticationError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Parses the Authorization header and returns the shopkeeperId (sub).
 * Supports both standard base64 JWTs (production) and base64url JWTs (local mock tokens).
 */
export function getShopkeeperIdFromRequest(request: NextRequest): string {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    // Decode JWT payload - convert base64url → base64 before parsing
    const parts = token.split('.');
    if (parts.length < 2) throw new Error('Malformed token');
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));

    if (!decoded.sub) {
      throw new AuthenticationError('Token missing subject (sub)');
    }

    return decoded.sub;
  } catch {
    throw new AuthenticationError('Invalid token format');
  }
}
