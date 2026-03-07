import { NextRequest, NextResponse } from 'next/server';
import { getShopkeeperIdFromRequest } from '@/lib/auth/server-auth';
import { logger } from '@/lib/logger';

/**
 * Middleware wrapper for API routes to enforce authentication.
 * It uses getShopkeeperIdFromRequest to validate the token.
 */
export function withAuth(handler: any): any {
  return async (request: NextRequest | Request, ...args: any[]) => {
    try {
      // Validate the token to ensure the request is authenticated
      getShopkeeperIdFromRequest(request as NextRequest);
      
      // Proceed to the actual route handler
      return await handler(request, ...args);
    } catch (error: any) {
      if (error && error.name === 'AuthenticationError') {
        return NextResponse.json(
          { error: error.message || 'Unauthorized' },
          { status: 401 }
        );
      }
      logger.error('Authentication middleware failed', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}
