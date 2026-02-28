/**
 * Performance Monitoring Service
 *
 * Task 13.1: Implement performance monitoring
 * Tracks response times, health checks, and Core Web Vitals.
 * Requirements: 2.2, 5.3
 */

// ============================================================================
// Types
// ============================================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'score';
  timestamp: string;
  tags?: Record<string, string>;
}

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: string;
}

// ============================================================================
// Response Time Tracking
// ============================================================================

const metrics: PerformanceMetric[] = [];

/**
 * Measure the execution time of an async function
 */
export async function measureResponseTime<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const elapsed = performance.now() - start;

    recordMetric({
      name,
      value: Math.round(elapsed),
      unit: 'ms',
      timestamp: new Date().toISOString(),
      tags,
    });

    // Warn if photo analysis exceeds 30 second SLA
    if (name.includes('analysis') && elapsed > 30000) {
      console.warn(`⚠️ ${name} exceeded 30s SLA: ${Math.round(elapsed)}ms`);
    }

    return result;
  } catch (error) {
    const elapsed = performance.now() - start;
    recordMetric({
      name: `${name}_error`,
      value: Math.round(elapsed),
      unit: 'ms',
      timestamp: new Date().toISOString(),
      tags: { ...tags, error: 'true' },
    });
    throw error;
  }
}

/**
 * Record a performance metric
 */
export function recordMetric(metric: PerformanceMetric): void {
  metrics.push(metric);

  // Keep only the last 100 metrics in memory
  if (metrics.length > 100) {
    metrics.splice(0, metrics.length - 100);
  }
}

/**
 * Get recent metrics (for dashboard display)
 */
export function getRecentMetrics(name?: string, limit = 20): PerformanceMetric[] {
  const filtered = name ? metrics.filter((m) => m.name === name) : metrics;
  return filtered.slice(-limit);
}

/**
 * Get average response time for a specific operation
 */
export function getAverageResponseTime(name: string): number {
  const matching = metrics.filter((m) => m.name === name && m.unit === 'ms');
  if (matching.length === 0) return 0;
  return Math.round(matching.reduce((sum, m) => sum + m.value, 0) / matching.length);
}

// ============================================================================
// Health Checks
// ============================================================================

/**
 * Run health checks on all critical services
 */
export async function runHealthChecks(): Promise<HealthStatus[]> {
  const checks: HealthStatus[] = [];

  // API health check
  checks.push(await checkEndpoint('api', '/api/health'));

  // Photo upload check
  checks.push(await checkEndpoint('photos', '/api/photos/analyze'));

  // Auction API check
  checks.push(await checkEndpoint('auctions', '/api/auctions'));

  return checks;
}

async function checkEndpoint(service: string, url: string): Promise<HealthStatus> {
  const start = performance.now();
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    const elapsed = performance.now() - start;

    return {
      service,
      status: response.ok ? 'healthy' : 'degraded',
      responseTime: Math.round(elapsed),
      lastCheck: new Date().toISOString(),
    };
  } catch {
    return {
      service,
      status: 'down',
      responseTime: Math.round(performance.now() - start),
      lastCheck: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Core Web Vitals
// ============================================================================

/**
 * Measure Core Web Vitals (LCP, FID, CLS)
 * Only works in browser environment
 */
export function observeWebVitals(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      recordMetric({
        name: 'lcp',
        value: Math.round(lastEntry.startTime),
        unit: 'ms',
        timestamp: new Date().toISOString(),
      });
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Not supported
  }

  // First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        recordMetric({
          name: 'fid',
          value: Math.round((entry as PerformanceEventTiming).processingStart - entry.startTime),
          unit: 'ms',
          timestamp: new Date().toISOString(),
        });
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // Not supported
  }
}
