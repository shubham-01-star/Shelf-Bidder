import { NextRequest } from 'next/server';
import {
  verifyAccessToken,
  type AuthRole,
  type VerifiedAuthTokenClaims,
} from './tokens';

export class AuthenticationError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  const shopkeeperToken = request.cookies.get('auth_token')?.value;
  if (shopkeeperToken) {
    return shopkeeperToken;
  }

  const brandToken = request.cookies.get('brand_auth_token')?.value;
  return brandToken || null;
}

export async function getAuthClaimsFromRequest(
  request: NextRequest,
  expectedRole?: AuthRole
): Promise<VerifiedAuthTokenClaims> {
  const token = getTokenFromRequest(request);

  if (!token) {
    throw new AuthenticationError('Missing or invalid authentication token');
  }

  try {
    const claims = await verifyAccessToken(token);
    if (expectedRole && claims.role !== expectedRole) {
      throw new AuthenticationError('Insufficient role for this resource');
    }
    if (!claims.sub) {
      throw new AuthenticationError('Token missing subject (sub)');
    }
    return claims;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Invalid or expired token');
  }
}

/**
 * Parses the authenticated request and returns the shopkeeperId (sub).
 */
export async function getShopkeeperIdFromRequest(request: NextRequest): Promise<string> {
  const claims = await getAuthClaimsFromRequest(request, 'shopkeeper');
  return claims.sub;
}
