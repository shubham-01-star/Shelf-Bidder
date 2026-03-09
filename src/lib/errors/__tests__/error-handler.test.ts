/**
 * Unit tests for Error Handler
 * Task 12.4: Unit tests for error scenarios
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  AppError,
  NetworkError,
  AIProcessingError,
  AuctionError,
  AuthenticationError,
  handleError,
  withRetry,
} from '../error-handler';

// ============================================================================
// Mock window for error handler actions
// ============================================================================

beforeEach(() => {
  Object.defineProperty(global, 'window', {
    value: {
      location: { reload: jest.fn(), href: '' },
    },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(global, 'navigator', {
    value: { onLine: true },
    writable: true,
    configurable: true,
  });
});

// ============================================================================
// Error Class Tests
// ============================================================================

describe('Error Classes', () => {
  it('NetworkError should be retryable', () => {
    const err = new NetworkError('Connection lost');
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.retryable).toBe(true);
    expect(err.name).toBe('NetworkError');
    expect(err.userMessage).toContain('Connection');
  });

  it('AIProcessingError should be retryable', () => {
    const err = new AIProcessingError('Model timeout');
    expect(err.code).toBe('AI_PROCESSING_ERROR');
    expect(err.retryable).toBe(true);
    expect(err.name).toBe('AIProcessingError');
  });

  it('AuctionError should not be retryable', () => {
    const err = new AuctionError('No bids', 'NO_BIDS');
    expect(err.code).toBe('NO_BIDS');
    expect(err.retryable).toBe(false);
    expect(err.name).toBe('AuctionError');
  });

  it('AuthenticationError should not be retryable', () => {
    const err = new AuthenticationError('Token expired');
    expect(err.code).toBe('AUTH_ERROR');
    expect(err.retryable).toBe(false);
    expect(err.name).toBe('AuthenticationError');
  });

  it('AppError should store metadata', () => {
    const err = new AppError('test', 'CODE', 'User msg', false, { key: 'value' });
    expect(err.metadata).toEqual({ key: 'value' });
  });
});

// ============================================================================
// handleError Tests
// ============================================================================

describe('handleError', () => {
  it('should handle NetworkError', () => {
    const result = handleError(new NetworkError('offline'));

    expect(result.title).toContain('Connection');
    expect(result.icon).toBe('📡');
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions[0].label).toContain('Try Again');
  });

  it('should handle TypeError with "fetch" as network error', () => {
    const result = handleError(new TypeError('Failed to fetch'));

    expect(result.title).toContain('Connection');
    expect(result.icon).toBe('📡');
  });

  it('should handle AIProcessingError', () => {
    const result = handleError(new AIProcessingError('Model failed'));

    expect(result.title).toContain('Analysis');
    expect(result.icon).toBe('🔍');
    expect(result.actions[0].label).toContain('Retake');
  });

  it('should handle AuctionError', () => {
    const result = handleError(new AuctionError('No bids', 'NO_BIDS'));

    expect(result.title).toContain('Auction');
    expect(result.icon).toBe('🏷️');
    expect(result.actions[0].label).toContain('Dashboard');
  });

  it('should handle AuthenticationError', () => {
    const result = handleError(new AuthenticationError('Expired'));

    expect(result.title).toContain('Session');
    expect(result.icon).toBe('🔒');
    expect(result.actions[0].label).toContain('Sign In');
  });

  it('should handle retryable AppError', () => {
    const err = new AppError('test', 'CUSTOM', 'Custom message', true);
    const result = handleError(err);

    expect(result.title).toContain('Something Went Wrong');
    expect(result.actions[0].label).toContain('Try Again');
  });

  it('should handle non-retryable AppError', () => {
    const err = new AppError('test', 'CUSTOM', 'Custom message', false);
    const result = handleError(err);

    expect(result.actions[0].label).toContain('Go Home');
  });

  it('should handle unknown errors with generic fallback', () => {
    const result = handleError('some string error');

    expect(result.title).toContain('Unexpected');
    expect(result.icon).toBe('❌');
    expect(result.actions.length).toBe(2);
  });

  it('should handle null/undefined errors', () => {
    const result = handleError(null);
    expect(result.title).toContain('Unexpected');

    const result2 = handleError(undefined);
    expect(result2.title).toContain('Unexpected');
  });

  it('should detect offline navigator as network error', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: false },
      writable: true,
      configurable: true,
    });
    const result = handleError(new Error('Some error'));
    expect(result.title).toContain('Connection');
  });
});

// ============================================================================
// withRetry Tests
// ============================================================================

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = jest.fn<() => Promise<string>>().mockResolvedValue('success');

    const result = await withRetry(fn, 3, 10);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    const fn = jest.fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, 3, 10);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries exceeded', async () => {
    const fn = jest.fn<() => Promise<string>>()
      .mockRejectedValue(new Error('always fails'));

    await expect(withRetry(fn, 2, 10)).rejects.toThrow('always fails');
    // 1 initial + 2 retries = 3 total calls
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should work with zero retries (single attempt)', async () => {
    const fn = jest.fn<() => Promise<string>>()
      .mockRejectedValue(new Error('fail'));

    await expect(withRetry(fn, 0, 10)).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
