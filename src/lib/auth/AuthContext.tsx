'use client';

/**
 * Authentication Context Provider
 * Manages authentication state and provides auth methods to the app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  verifyPhoneNumber as authVerifyPhoneNumber,
  refreshAccessToken,
  decodeIdToken,
  isTokenExpired,
  storeAuthTokens,
  getStoredAuthTokens,
  storeShopkeeperProfile,
  getStoredShopkeeperProfile,
  type AuthTokens,
  type ShopkeeperProfile,
} from './client-auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  shopkeeper: ShopkeeperProfile | null;
  tokens: AuthTokens | null;
  signIn: (phoneNumber: string, password: string) => Promise<void>;
  signUp: (phoneNumber: string, password: string, name: string, email: string, storeAddress: string) => Promise<void>;
  verifyPhoneNumber: (phoneNumber: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shopkeeper, setShopkeeper] = useState<ShopkeeperProfile | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  // Initialize auth state from local storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedTokens = getStoredAuthTokens();
        const storedProfile = getStoredShopkeeperProfile();

        if (storedTokens && storedProfile) {
          // Check if token is expired
          if (isTokenExpired(storedTokens.expiresAt)) {
            // Try to refresh token
            try {
              const newTokens = await refreshAccessToken(storedTokens.refreshToken);
              storeAuthTokens(newTokens);
              setTokens(newTokens);
              setShopkeeper(storedProfile);
              setIsAuthenticated(true);
            } catch (error) {
              // Refresh failed, clear auth state
              await handleSignOut();
            }
          } else {
            // Token is still valid
            setTokens(storedTokens);
            setShopkeeper(storedProfile);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Auto-refresh tokens before expiry
  useEffect(() => {
    if (!tokens || !isAuthenticated) {
      return;
    }

    const timeUntilExpiry = tokens.expiresAt - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0); // 5 minutes before expiry

    const timer = setTimeout(async () => {
      try {
        await handleRefreshTokens();
      } catch (error) {
        console.error('Auto token refresh failed:', error);
        await handleSignOut();
      }
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [tokens, isAuthenticated]);

  const handleSignIn = async (phoneNumber: string, password: string) => {
    try {
      const authTokens = await authSignIn(phoneNumber, password);
      const profile = decodeIdToken(authTokens.idToken);

      storeAuthTokens(authTokens);
      storeShopkeeperProfile(profile);

      setTokens(authTokens);
      setShopkeeper(profile);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const handleSignUp = async (
    phoneNumber: string,
    password: string,
    name: string,
    email: string,
    storeAddress: string
  ) => {
    try {
      await authSignUp(phoneNumber, password, name, email, storeAddress);
    } catch (err) {
      throw err;
    }
  };

  const handleVerifyPhoneNumber = async (phoneNumber: string, code: string) => {
    try {
      await authVerifyPhoneNumber(phoneNumber, code);
    } catch (error) {
      console.error('Verification error:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await authSignOut();
      setTokens(null);
      setShopkeeper(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const handleRefreshTokens = async () => {
    if (!tokens) {
      throw new Error('No tokens to refresh');
    }

    try {
      const newTokens = await refreshAccessToken(tokens.refreshToken);
      storeAuthTokens(newTokens);
      setTokens(newTokens);
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    shopkeeper,
    tokens,
    signIn: handleSignIn,
    signUp: handleSignUp,
    verifyPhoneNumber: handleVerifyPhoneNumber,
    signOut: handleSignOut,
    refreshTokens: handleRefreshTokens,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
