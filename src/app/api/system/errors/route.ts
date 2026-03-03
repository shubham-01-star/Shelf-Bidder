import { NextResponse } from 'next/server';
import { errorTracker } from '@/lib/monitoring/error-tracker';
import { withApiLogging } from '@/lib/middleware/api-logger';

/**
 * System Errors API
 * Task 15.1: Error tracking and monitoring
 */

async function handleGET() {
  try {
    const statistics = errorTracker.getStatistics();
    const recentErrors = errorTracker.getRecentErrors(20);

    return NextResponse.json({
      statistics,
      recentErrors: recentErrors.map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        component: e.context.component,
        operation: e.context.operation,
        severity: e.severity,
        message: e.error.message,
        resolved: e.resolved,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve error statistics' },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGET);
