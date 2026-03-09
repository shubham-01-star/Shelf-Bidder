/**
 * Error Handling Utilities
 *
 * Task 12.1: Comprehensive error handling
 * Centralized error handling for network, AI, auction, and user interface errors.
 * Requirements: 8.3, 9.3
 */

// ============================================================================
// Error Types
// ============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly userMessage: string,
    public readonly retryable: boolean = false,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(
      message,
      'NETWORK_ERROR',
      'Connection issue. Your data is saved and will sync automatically.',
      true,
      metadata
    );
    this.name = 'NetworkError';
  }
}

export class AIProcessingError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(
      message,
      'AI_PROCESSING_ERROR',
      'Unable to analyze the photo. Please try taking another photo with better lighting.',
      true,
      metadata
    );
    this.name = 'AIProcessingError';
  }
}

export class AuctionError extends AppError {
  constructor(message: string, code: string, metadata?: Record<string, unknown>) {
    super(
      message,
      code,
      'There was an issue with the auction. Please try again later.',
      false,
      metadata
    );
    this.name = 'AuctionError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(
      message,
      'AUTH_ERROR',
      'Please sign in again to continue.',
      false
    );
    this.name = 'AuthenticationError';
  }
}

// ============================================================================
// Error Handler
// ============================================================================

interface ErrorAction {
  label: string;
  action: () => void;
}

export interface HandledError {
  title: string;
  message: string;
  icon: string;
  actions: ErrorAction[];
}

/**
 * Handle errors and return user-friendly information
 */
export function handleError(error: unknown): HandledError {
  // Network errors
  if (error instanceof NetworkError || isNetworkError(error)) {
    return {
      title: 'Connection Problem',
      message: 'Your data is saved locally. It will sync when you\'re back online.',
      icon: '📡',
      actions: [
        { label: 'Try Again', action: () => window.location.reload() },
      ],
    };
  }

  // AI processing errors
  if (error instanceof AIProcessingError) {
    return {
      title: 'Analysis Failed',
      message: error.userMessage,
      icon: '🔍',
      actions: [
        { label: 'Retake Photo', action: () => window.location.href = '/camera' },
      ],
    };
  }

  // Auction errors
  if (error instanceof AuctionError) {
    return {
      title: 'Auction Issue',
      message: error.userMessage,
      icon: '🏷️',
      actions: [
        { label: 'Go to Dashboard', action: () => window.location.href = '/dashboard' },
      ],
    };
  }

  // Auth errors
  if (error instanceof AuthenticationError) {
    return {
      title: 'Session Expired',
      message: error.userMessage,
      icon: '🔒',
      actions: [
        { label: 'Sign In', action: () => window.location.href = '/signin' },
      ],
    };
  }

  // App errors (custom)
  if (error instanceof AppError) {
    return {
      title: 'Something Went Wrong',
      message: error.userMessage,
      icon: '⚠️',
      actions: error.retryable
        ? [{ label: 'Try Again', action: () => window.location.reload() }]
        : [{ label: 'Go Home', action: () => window.location.href = '/dashboard' }],
    };
  }

  // Generic errors
  return {
    title: 'Unexpected Error',
    message: 'Something went wrong. Please try again.',
    icon: '❌',
    actions: [
      { label: 'Refresh', action: () => window.location.reload() },
      { label: 'Go Home', action: () => window.location.href = '/dashboard' },
    ],
  };
}

// ============================================================================
// Helpers
// ============================================================================

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) return true;
  if (error instanceof Error && error.message.includes('network')) return true;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  return false;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}
