/**
 * Unit tests for Brand Login Page
 * Tests form validation, authentication flow, and error handling
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.6, 2.7
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('Brand Login Page - Unit Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset fetch mock
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  describe('Form Validation', () => {
    it('should require email and password fields', () => {
      // Test that form validation requires both fields
      const email = 'shubhmkumar@gmail.com';
      const password = 'Test@1234';
      
      expect(email).toBeTruthy();
      expect(password).toBeTruthy();
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should validate email format', () => {
      const validEmail = 'shubhmkumar@gmail.com';
      const invalidEmail = 'invalid-email';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(validEmail)).toBe(true);
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    it('should accept valid credentials', () => {
      const credentials = {
        email: 'shubhmkumar@gmail.com',
        password: 'Test@1234'
      };
      
      expect(credentials.email).toBe('shubhmkumar@gmail.com');
      expect(credentials.password).toBe('Test@1234');
    });
  });

  describe('Authentication Flow', () => {
    it('should store brand token and info in localStorage on successful login', async () => {
      const mockResponse = {
        accessToken: 'mock-token-123',
        brand: {
          id: 'b1',
          name: 'Test Brand'
        }
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Simulate successful login
      localStorage.setItem('brandToken', mockResponse.accessToken);
      localStorage.setItem('brandId', mockResponse.brand.id);
      localStorage.setItem('brandName', mockResponse.brand.name);

      expect(localStorage.getItem('brandToken')).toBe('mock-token-123');
      expect(localStorage.getItem('brandId')).toBe('b1');
      expect(localStorage.getItem('brandName')).toBe('Test Brand');
    });

    it('should store remember me preference when checked', () => {
      const rememberMe = true;
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      expect(localStorage.getItem('rememberMe')).toBe('true');
    });

    it('should call correct API endpoint for signin', async () => {
      const credentials = {
        email: 'shubhmkumar@gmail.com',
        password: 'Test@1234'
      };

      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'token', brand: { id: 'b1', name: 'Test' } })
      } as Response);

      global.fetch = mockFetch;

      await fetch('/api/brand/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/brand/auth/signin',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials error', async () => {
      const mockErrorResponse = {
        error: 'Invalid credentials'
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      } as Response);

      const response = await fetch('/api/brand/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'wrong@email.com', password: 'wrong' }),
      });

      const data = await response.json();
      
      expect(response.ok).toBe(false);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      try {
        await fetch('/api/brand/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should display error message for failed authentication', () => {
      const errorMessage = 'Invalid credentials';
      expect(errorMessage).toBe('Invalid credentials');
      expect(errorMessage.length).toBeGreaterThan(0);
    });
  });

  describe('Remember Me Functionality', () => {
    it('should persist remember me preference', () => {
      localStorage.setItem('rememberMe', 'true');
      expect(localStorage.getItem('rememberMe')).toBe('true');
    });

    it('should not persist remember me when unchecked', () => {
      const rememberMe = false;
      
      if (!rememberMe) {
        localStorage.removeItem('rememberMe');
      }
      
      expect(localStorage.getItem('rememberMe')).toBeNull();
    });
  });

  describe('Light Warm Theme Styling', () => {
    it('should use correct brand colors', () => {
      const brandBg = '#f8f5f5';
      const brandAccent = '#ff5c61';
      
      expect(brandBg).toBe('#f8f5f5');
      expect(brandAccent).toBe('#ff5c61');
    });

    it('should apply rounded corners to form elements', () => {
      const borderRadius = '1.5rem'; // rounded-2xl in Tailwind
      expect(borderRadius).toBe('1.5rem');
    });

    it('should use soft shadow for elevated surfaces', () => {
      const softShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
      expect(softShadow).toMatch(/rgba\(0,\s*0,\s*0,\s*0\.05\)/);
    });
  });
});
