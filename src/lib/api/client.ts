/**
 * Authenticated API Client
 * Handles API requests with JWT authentication and rate limiting
 */

import { getAWSConfig, APIConfig } from '@/types/aws-config';
import { getStoredAuthTokens, refreshAccessToken, storeAuthTokens } from '@/lib/auth/cognito';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class RateLimitError extends APIError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  retryCount?: number;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    requiresAuth = true,
    retryCount = 0,
    headers = {},
    ...fetchOptions
  } = options;

  const config = getAWSConfig();
  const url = `${config.apiUrl}${endpoint}`;

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge with provided headers
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        requestHeaders[key] = value;
      }
    });
  }

  // Add authentication token if required
  if (requiresAuth) {
    const tokens = getStoredAuthTokens();
    
    if (!tokens) {
      throw new APIError('Not authenticated', 401, 'UNAUTHORIZED');
    }

    // Check if token needs refresh
    const isExpired = Date.now() >= tokens.expiresAt - 60000; // 1 minute buffer
    
    if (isExpired) {
      try {
        const newTokens = await refreshAccessToken(tokens.refreshToken);
        storeAuthTokens(newTokens);
        requestHeaders['Authorization'] = `Bearer ${newTokens.accessToken}`;
      } catch (error) {
        throw new APIError('Token refresh failed', 401, 'TOKEN_REFRESH_FAILED');
      }
    } else {
      requestHeaders['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      throw new RateLimitError(
        'Rate limit exceeded. Please try again later.',
        retryAfter
      );
    }

    // Handle authentication errors
    if (response.status === 401) {
      // Try to refresh token once
      if (requiresAuth && retryCount === 0) {
        const tokens = getStoredAuthTokens();
        if (tokens) {
          try {
            const newTokens = await refreshAccessToken(tokens.refreshToken);
            storeAuthTokens(newTokens);
            // Retry request with new token
            return apiRequest<T>(endpoint, { ...options, retryCount: 1 });
          } catch (error) {
            throw new APIError('Authentication failed', 401, 'UNAUTHORIZED');
          }
        }
      }
      throw new APIError('Authentication failed', 401, 'UNAUTHORIZED');
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData.code
      );
    }

    // Parse response
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Re-throw API errors
    if (error instanceof APIError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new APIError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    // Handle unknown errors
    throw new APIError(
      'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Retry a request with exponential backoff
 */
export async function retryRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
  maxRetries: number = APIConfig.RETRY_ATTEMPTS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiRequest<T>(endpoint, options);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on authentication errors or rate limiting
      if (
        error instanceof APIError &&
        (error.statusCode === 401 || error.statusCode === 429)
      ) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate backoff delay
      const delay = APIConfig.RETRY_DELAY * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * GET request
 */
export async function get<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST request
 */
export async function post<T>(
  endpoint: string,
  data?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function put<T>(
  endpoint: string,
  data?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function del<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

/**
 * Upload file with progress tracking
 */
export async function uploadFile(
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string }> {
  const config = getAWSConfig();
  const url = `${config.apiUrl}${endpoint}`;

  const tokens = getStoredAuthTokens();
  if (!tokens) {
    throw new APIError('Not authenticated', 401, 'UNAUTHORIZED');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new APIError('Invalid response', xhr.status));
        }
      } else {
        reject(new APIError('Upload failed', xhr.status));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new APIError('Network error', 0, 'NETWORK_ERROR'));
    });

    xhr.addEventListener('abort', () => {
      reject(new APIError('Upload cancelled', 0, 'CANCELLED'));
    });

    // Prepare and send request
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${tokens.accessToken}`);

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}
