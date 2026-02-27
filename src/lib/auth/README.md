# Authentication System

This directory contains the authentication system for Shelf-Bidder, implementing AWS Cognito integration with JWT token handling.

## Architecture

The authentication system consists of:

1. **AWS Cognito** - Identity provider for shopkeeper authentication
2. **JWT Tokens** - Access, ID, and refresh tokens for secure API access
3. **React Context** - Client-side authentication state management
4. **API Routes** - Server-side authentication endpoints
5. **Middleware** - Edge authentication and route protection

## Components

### `cognito.ts`
Core authentication utilities for AWS Cognito integration:
- `signIn()` - Authenticate with phone number and password
- `signUp()` - Register new shopkeeper
- `verifyPhoneNumber()` - Verify phone with OTP code
- `signOut()` - Clear authentication state
- `refreshAccessToken()` - Refresh expired tokens
- `decodeIdToken()` - Extract user profile from JWT
- Token storage and retrieval functions

### `AuthContext.tsx`
React Context Provider for authentication state:
- Manages authentication state across the app
- Provides authentication methods to components
- Handles automatic token refresh
- Persists auth state in localStorage

### API Routes (`/app/api/auth/`)
Server-side authentication endpoints:
- `POST /api/auth/signin` - Sign in with credentials
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/verify` - Verify phone number
- `POST /api/auth/refresh` - Refresh access token

## Usage

### 1. Wrap your app with AuthProvider

```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/auth/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Use authentication in components

```tsx
'use client';

import { useAuth } from '@/lib/auth/AuthContext';

export function MyComponent() {
  const { isAuthenticated, shopkeeper, signIn, signOut } = useAuth();

  const handleSignIn = async () => {
    try {
      await signIn('+1234567890', 'password123');
      // User is now authenticated
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  if (!isAuthenticated) {
    return <button onClick={handleSignIn}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome, {shopkeeper?.name}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### 3. Protect routes

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

### 4. Make authenticated API requests

```tsx
import { get, post } from '@/lib/api/client';

// GET request with authentication
const data = await get('/shopkeepers/profile');

// POST request with authentication
const result = await post('/shelf-spaces', {
  photoUrl: 'https://...',
});
```

## Security Features

### JWT Token Handling
- Access tokens for API authentication
- ID tokens for user profile information
- Refresh tokens for obtaining new access tokens
- Automatic token refresh before expiry
- Secure token storage in localStorage

### Rate Limiting
- API Gateway configured with rate limits (100 req/s, 200 burst)
- Client-side rate limit error handling
- Retry-After header support

### Authentication Flow
1. User signs up with phone number and password
2. AWS Cognito sends OTP to phone
3. User verifies phone with OTP code
4. User signs in with credentials
5. Cognito returns JWT tokens
6. Tokens stored in localStorage
7. Access token included in API requests
8. Tokens automatically refreshed before expiry

### Password Policy
- Minimum 8 characters
- Requires lowercase letter
- Requires uppercase letter
- Requires digit
- No special characters required (for low-tech users)

## Configuration

### Environment Variables
Required environment variables (see `.env.local.example`):

```bash
NEXT_PUBLIC_API_URL=https://your-api-gateway-url
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### AWS Cognito Setup
The Cognito User Pool is configured with:
- Phone number as primary identifier
- Phone number auto-verification
- Password-based authentication
- SRP (Secure Remote Password) support
- No MFA (for simplicity with low-tech users)

## Implementation Status

### ✅ Completed
- Authentication utilities and types
- React Context and hooks
- API client with JWT handling
- Protected route component
- Next.js middleware
- API route handlers (structure)
- Infrastructure (CDK stack)
- Rate limiting configuration

### 🚧 Pending
- AWS Cognito SDK integration in API routes
- Full implementation of sign in/up/verify endpoints
- Token refresh implementation
- Error handling improvements
- Unit tests for authentication flows

## Next Steps

To complete the authentication implementation:

1. **Add AWS SDK dependencies**:
   ```bash
   npm install @aws-sdk/client-cognito-identity-provider
   ```

2. **Implement Cognito SDK calls** in API routes:
   - Use `InitiateAuthCommand` for sign in
   - Use `SignUpCommand` for registration
   - Use `ConfirmSignUpCommand` for verification
   - Use `RefreshTokenAuthCommand` for token refresh

3. **Test authentication flow**:
   - Sign up new user
   - Verify phone number
   - Sign in with credentials
   - Make authenticated API requests
   - Test token refresh

4. **Add error handling**:
   - Invalid credentials
   - User already exists
   - Invalid verification code
   - Network errors
   - Rate limiting

## Related Files

- `/infrastructure/lib/shelf-bidder-stack.ts` - CDK infrastructure
- `/src/lib/api/client.ts` - Authenticated API client
- `/src/middleware.ts` - Route protection middleware
- `/src/components/auth/ProtectedRoute.tsx` - Protected route component
- `/src/types/aws-config.ts` - AWS configuration types
