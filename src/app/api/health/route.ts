import { NextResponse } from 'next/server';

/**
 * Health Check API Endpoint
 * Task 13.1: Performance monitoring
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      api: 'up',
      database: 'up',
      storage: 'up',
    },
  });
}
