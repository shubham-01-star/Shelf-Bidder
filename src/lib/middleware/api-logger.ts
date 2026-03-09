/**
 * API Request Logging Middleware
 * Task 15.1: Comprehensive logging and monitoring
 * 
 * Logs all API requests with timing, status codes, and errors
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { performanceMonitor } from '@/lib/monitoring/performance';

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  logRequest?: boolean;
  logResponse?: boolean;
}

/**
 * Wraps an API handler with logging and monitoring
 */
export function withApiLogging<T>(
  handler: (request: Request, context?: T) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
) {
  return async (request: Request, context?: T): Promise<NextResponse> => {
    const startTime = Date.now();
    const { method, url } = request;
    const path = new URL(url).pathname;
    
    // Generate request ID for tracing
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Log incoming request
      if (options.logRequest !== false) {
        logger.info('API Request Started', {
          requestId,
          method,
          path,
          userAgent: request.headers.get('user-agent'),
        });
      }
      
      // Execute handler
      const response = await handler(request, context);
      
      // Calculate duration
      const duration = Date.now() - startTime;
      
      // Record performance metric
      performanceMonitor.record('api_request', duration);
      
      // Log response
      const statusCode = response.status;
      logger.apiRequest(method, path, statusCode, duration, {
        requestId,
        success: statusCode < 400,
      });
      
      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error
      logger.error('API Request Failed', error, {
        requestId,
        method,
        path,
        duration,
      });
      
      // Record error metric
      performanceMonitor.record('api_request_error', duration);
      
      // Return error response
      return NextResponse.json(
        {
          error: 'Internal server error',
          requestId,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { 
          status: 500,
          headers: { 'X-Request-ID': requestId },
        }
      );
    }
  };
}

/**
 * Extract user ID from request (if authenticated)
 */
export function extractUserId(request: Request): string | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    
    // Parse JWT token (simplified - in production use proper JWT library)
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.userId || null;
  } catch {
    return null;
  }
}
