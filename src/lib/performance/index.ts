/**
 * Performance Module Exports
 * Task 13: Performance Optimization and Monitoring
 */

export {
  measureResponseTime,
  recordMetric,
  getRecentMetrics,
  getAverageResponseTime,
  runHealthChecks,
  observeWebVitals,
  type PerformanceMetric,
  type HealthStatus,
} from './monitor';

export {
  compressImage,
  imageToBase64,
  getFileSizeKB,
  needsCompression,
  createLazyLoader,
} from './image-optimizer';
