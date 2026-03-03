import { NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring/performance';
import { withApiLogging } from '@/lib/middleware/api-logger';

/**
 * System Metrics API
 * Task 15.1: Performance monitoring
 */

async function handleGET() {
  try {
    const metrics = performanceMonitor.getMetrics();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      metrics: Object.entries(metrics).map(([operation, stats]) => ({
        operation,
        ...stats,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve performance metrics' },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGET);
