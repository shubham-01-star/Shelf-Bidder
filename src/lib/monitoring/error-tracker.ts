/**
 * Error Tracking and Alerting System
 * Task 15.1: Comprehensive monitoring
 * 
 * Tracks errors, generates alerts, and provides error analytics
 */

import { logger } from '@/lib/logger';

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: Error;
  context: {
    component: string;
    operation: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

class ErrorTracker {
  private errors: ErrorReport[] = [];
  private readonly MAX_ERRORS = 100;
  private errorCounts: Map<string, number> = new Map();

  /**
   * Track an error with context
   */
  track(
    error: Error,
    component: string,
    operation: string,
    severity: ErrorReport['severity'] = 'medium',
    metadata?: Record<string, unknown>
  ): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error,
      context: {
        component,
        operation,
        metadata,
      },
      severity,
      resolved: false,
    };

    this.errors.push(report);

    // Keep only recent errors
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors.shift();
    }

    // Track error frequency
    const errorKey = `${component}:${operation}`;
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);

    // Log error
    logger.error(`Error in ${component}.${operation}`, error, {
      errorId,
      severity,
      ...metadata,
    });

    // Check if we need to alert
    if (severity === 'critical' || count > 10) {
      this.sendAlert(report, count);
    }

    return errorId;
  }

  /**
   * Send alert for critical errors or high frequency errors
   */
  private sendAlert(report: ErrorReport, frequency: number) {
    logger.warn('Error alert triggered', {
      errorId: report.id,
      component: report.context.component,
      operation: report.context.operation,
      severity: report.severity,
      frequency,
      message: report.error.message,
    });

    // TODO: Integrate with alerting service (SNS, PagerDuty, etc.)
    // For now, just log the alert
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 20): ErrorReport[] {
    return this.errors.slice(-limit);
  }

  /**
   * Get errors by component
   */
  getErrorsByComponent(component: string): ErrorReport[] {
    return this.errors.filter(e => e.context.component === component);
  }

  /**
   * Get error statistics
   */
  getStatistics() {
    const total = this.errors.length;
    const bySeverity = {
      low: this.errors.filter(e => e.severity === 'low').length,
      medium: this.errors.filter(e => e.severity === 'medium').length,
      high: this.errors.filter(e => e.severity === 'high').length,
      critical: this.errors.filter(e => e.severity === 'critical').length,
    };

    const byComponent: Record<string, number> = {};
    this.errors.forEach(e => {
      byComponent[e.context.component] = (byComponent[e.context.component] || 0) + 1;
    });

    const topErrors = Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ operation: key, count }));

    return {
      total,
      bySeverity,
      byComponent,
      topErrors,
      resolved: this.errors.filter(e => e.resolved).length,
      unresolved: this.errors.filter(e => !e.resolved).length,
    };
  }

  /**
   * Mark error as resolved
   */
  resolve(errorId: string) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      logger.info('Error resolved', { errorId });
    }
  }

  /**
   * Clear all errors
   */
  clear() {
    this.errors = [];
    this.errorCounts.clear();
  }
}

export const errorTracker = new ErrorTracker();

/**
 * Decorator for tracking errors in async functions
 */
export function trackErrors(component: string, operation: string, severity: ErrorReport['severity'] = 'medium') {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        errorTracker.track(
          error as Error,
          component,
          operation,
          severity,
          { method: propertyKey, args }
        );
        throw error;
      }
    };

    return descriptor;
  };
}
