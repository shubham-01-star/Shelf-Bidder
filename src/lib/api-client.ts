import { getStoredAuthTokens, refreshAccessToken, storeAuthTokens, isTokenExpired } from './auth/client-auth';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getValidToken(): Promise<string | null> {
  const tokens = getStoredAuthTokens();
  if (!tokens) return null;

  if (isTokenExpired(tokens.expiresAt)) {
    try {
      const newTokens = await refreshAccessToken(tokens.refreshToken);
      storeAuthTokens(newTokens);
      return newTokens.idToken;
    } catch (error) {
      console.error('Failed to refresh token during API call', error);
      return null; // Will likely cause a 401
    }
  }

  return tokens.idToken;
}

export async function fetcher<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getValidToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    credentials: options.credentials ?? 'include',
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred while fetching the data.';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let errorData: any;
    try {
      errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = await response.text() || response.statusText;
    }
    throw new ApiError(response.status, errorMessage, errorData);
  }

  // Handle empty responses (like 204 No Content)
  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as unknown as T);
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) => fetcher<T>(url, { ...options, method: 'GET' }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: <T>(url: string, body?: any, options?: RequestInit) => 
    fetcher<T>(url, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put: <T>(url: string, body?: any, options?: RequestInit) => 
    fetcher<T>(url, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: <T>(url: string, body?: any, options?: RequestInit) => 
    fetcher<T>(url, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string, options?: RequestInit) => fetcher<T>(url, { ...options, method: 'DELETE' }),
};
