/**
 * AWS Cognito Authentication Utilities
 * Handles shopkeeper authentication using AWS Cognito
 */

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface ShopkeeperProfile {
  id: string;
  phoneNumber: string;
  name: string;
  email?: string;
}

/**
 * Sign in with phone number and password
 */
export async function signIn(
  phoneNumber: string,
  password: string
): Promise<AuthTokens> {
  
  // In a real implementation, this would use AWS Cognito SDK
  // For now, we'll call our API endpoint that handles Cognito authentication
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const response = await fetch(`${baseUrl}/api/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumber,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Sign in failed');
  }

  const data = await response.json();
  
  return {
    accessToken: data.accessToken,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
  };
}

/**
 * Sign up a new shopkeeper
 */
export async function signUp(
  phoneNumber: string,
  password: string,
  name: string,
  email: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  
  const response = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumber,
      password,
      name,
      email,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Sign up failed');
  }
}

/**
 * Verify phone number with OTP code
 */
export async function verifyPhoneNumber(
  phoneNumber: string,
  code: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  
  const response = await fetch(`${baseUrl}/api/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumber,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Verification failed');
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  // Clear local storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('shopkeeper_profile');
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<AuthTokens> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  
  const response = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  
  return {
    accessToken: data.accessToken,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
  };
}

/**
 * Get current user profile from ID token
 */
export function decodeIdToken(idToken: string): ShopkeeperProfile {
  try {
    // Decode JWT token payload (supports both base64 and base64url)
    const parts = idToken.split('.');
    
    // For our "simple" and "brand" mock tokens, the payload is the second part
    // Format: type.payload.suffix
    let payloadPart = '';
    if (parts.length === 3 && (parts[0] === 'simple' || parts[0] === 'brand' || parts[2] === 'token')) {
      payloadPart = parts[1];
    } else if (parts.length >= 2) {
      // Standard JWT format: header.payload.signature
      payloadPart = parts[1];
    } else {
      throw new Error('Malformed token');
    }

    // Convert base64url → base64 (replace - with +, _ with /)
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    // Pad to multiple of 4
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));

    return {
      id: decoded.sub || decoded.id,
      phoneNumber: decoded.phone_number || '',
      name: decoded.name,
      email: decoded.email,
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    throw new Error('Invalid ID token');
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 60000; // 1 minute buffer
}

/**
 * Store auth tokens in local storage
 */
export function storeAuthTokens(tokens: AuthTokens): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }
}

/**
 * Get auth tokens from local storage
 */
export function getStoredAuthTokens(): AuthTokens | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const stored = localStorage.getItem('auth_tokens');
  if (!stored) {
    return null;
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Store shopkeeper profile in local storage
 */
export function storeShopkeeperProfile(profile: ShopkeeperProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('shopkeeper_profile', JSON.stringify(profile));
  }
}

/**
 * Get shopkeeper profile from local storage
 */
export function getStoredShopkeeperProfile(): ShopkeeperProfile | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const stored = localStorage.getItem('shopkeeper_profile');
  if (!stored) {
    return null;
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
