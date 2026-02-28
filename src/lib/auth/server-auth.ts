import { NextRequest } from 'next/server';

export class AuthenticationError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Parses the Authorization header and returns the shopkeeperId (sub)
 * In a real production app (or behind AWS API Gateway), the token signature 
 * would be verified. For this Next.js MVP layer, we decode the JWT payload.
 */
export function getShopkeeperIdFromRequest(request: NextRequest): string {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Decode JWT token (base64)
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    
    if (!decoded.sub) {
      throw new AuthenticationError('Token missing subject (sub)');
    }
    
    return decoded.sub;
  } catch {
    throw new AuthenticationError('Invalid token format');
  }
}
