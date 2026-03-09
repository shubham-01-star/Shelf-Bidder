/**
 * Performance monitoring utilities for production
 */

import { logger } from '../logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 100;

  /**
   * Record a performance metric
   */
  record(name: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms') {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log slow operations
    if (unit === 'ms' && value > 3000) {
      logger.warn('Slow operation detected', {
        operation: name,
        duration: value,
        threshold: 3000,
      });
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(metric);
    }
  }

  /**
   * Measure execution time of a function
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.record(name, duration, 'ms');
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.record(`${name}_error`, duration, 'ms');
      throw error;
    }
  }

  /**
   * Get average metric value
   */
  getAverage(name: string): number | null {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return null;
    
    const sum = filtered.reduce((acc, m) => acc + m.value, 0);
    return sum / filtered.length;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Send metric to monitoring service
   */
  private sendToMonitoring(metric: PerformanceMetric) {
    // TODO: Integrate with CloudWatch or other monitoring service
    // For now, just log structured data
    logger.info('Performance metric', {
      metric: metric.name,
      value: metric.value,
      unit: metric.unit,
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Web Vitals monitoring for client-side
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: 'web-vital' | 'custom';
}) {
  if (metric.label === 'web-vital') {
    performanceMonitor.record(`web_vital_${metric.name}`, metric.value, 'ms');
    
    // Log poor Core Web Vitals
    const thresholds: Record<string, number> = {
      FCP: 1800,  // First Contentful Paint
      LCP: 2500,  // Largest Contentful Paint
      FID: 100,   // First Input Delay
      CLS: 0.1,   // Cumulative Layout Shift
      TTFB: 800,  // Time to First Byte
    };

    if (thresholds[metric.name] && metric.value > thresholds[metric.name]) {
      logger.warn('Poor Web Vital detected', {
        metric: metric.name,
        value: metric.value,
        threshold: thresholds[metric.name],
      });
    }
  }
}
