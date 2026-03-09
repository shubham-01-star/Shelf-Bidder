/**
 * API Client Utilities Index
 * Central export point for all API client functions
 */

// Brand Dashboard API functions
export {
  fetchDashboardMetrics,
  fetchProducts,
  fetchAuctions,
  fetchTransactions,
  submitRecharge,
  submitBid,
} from './brand-dashboard';

// Re-export base API client and error class
export { apiClient, ApiError } from '../api-client';
