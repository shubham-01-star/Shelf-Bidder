# Authentication and Security Setup

This document describes the authentication and security implementation for Shelf-Bidder, covering AWS Cognito integration, JWT token handling, and API Gateway security.

## Overview

The authentication system implements:
- **AWS Cognito** for shopkeeper identity management
- **JWT tokens** for secure API authentication
- **API Gateway** with authentication and rate limiting
- **Client-side** authentication state management
- **Server-side** authentication middleware

## Architecture

```
┌─────────────────┐
│   Next.js PWA   │
│  (Client-side)  │
└────────┬────────┘
         │
         │ JWT Tokens
         │
┌────────▼────────┐
│  API Gateway    │
│  + Cognito Auth │
│  + Rate Limit   │
└────────┬────────┘
         │
         │
┌────────▼────────┐
│ Lambda Functions│
│  (Backend API)  │
└─────────────────┘
```

## Components

### 1. AWS Cognito User Pool

**Location**: `infrastructure/lib/shelf-bidder-stack.ts`

**Configuration**:
- User Pool Name: `ShelfBidder-Shopkeepers`
- Sign-in: Phone number only (no email/username)
- Auto-verify: Phone number via SMS
- Password Policy:
  - Minimum 8 characters
  - Requires: lowercase, uppercase, digit
  - No special characters (for low-tech users)
- Account Recovery: Phone-only (no MFA)

**User Pool Client**:
- Client Name: `ShelfBidder-PWA`
- Auth Flows: USER_PASSWORD_AUTH, USER_SRP_AUTH
- No client secret (public client for PWA)

### 2. API Gateway Authentication

**Location**: `infrastructure/lib/shelf-bidder-stack.ts`

**Configuration**:
- Cognito User Pool Authorizer
- Rate Limiting:
  - Rate: 100 requests/second
  - Burst: 200 requests
- CORS enabled for PWA access
- Request validation enabled

**Protected Endpoints**:
All endpoints except `/auth/*` require authentication:
- `/shopkeepers/*`
- `/shelf-spaces/*`
- `/auctions/*`
- `/tasks/*`
- `/wallet/*`

### 3. Client-Side Authentication

#### Authentication Utilities (`src/lib/auth/cognito.ts`)

Core functions for Cognito integration:

```typescript
// Sign in with phone and password
await signIn('+1234567890', 'password123');

// Register new shopkeeper
await signUp('+1234567890', 'password123', 'John Doe');

// Verify phone with OTP
await verifyPhoneNumber('+1234567890', '123456');

// Sign out
await signOut();

// Refresh access token
await refreshAccessToken(refreshToken);
```

#### Authentication Context (`src/lib/auth/AuthContext.tsx`)

React Context Provider for authentication state:

```typescript
const {
  isAuthenticated,  // Boolean: user logged in
  isLoading,        // Boolean: checking auth state
  shopkeeper,       // User profile
  tokens,           // JWT tokens
  signIn,           // Sign in function
  signUp,           // Sign up function
  verifyPhoneNumber, // Verify function
  signOut,          // Sign out function
  refreshTokens,    // Refresh function
} = useAuth();
```

**Features**:
- Automatic token refresh before expiry
- Persistent authentication (localStorage)
- Loading states for UI
- Error handling

#### API Client (`src/lib/api/client.ts`)

Authenticated HTTP client with:
- Automatic JWT token injection
- Token refresh on 401 errors
- Rate limit handling
- Retry with exponential backoff
- File upload with progress tracking

```typescript
// GET request
const data = await get('/shopkeepers/profile');

// POST request
const result = await post('/shelf-spaces', { photoUrl: '...' });

// Upload file
await uploadFile('/photos/upload', file, (progress) => {
  console.log(`Upload: ${progress}%`);
});
```

### 4. Route Protection

#### Next.js Middleware (`src/middleware.ts`)

Edge middleware for route protection:
- Redirects unauthenticated users to sign-in
- Protects all routes except public pages
- Returns 401 for unauthenticated API requests

**Public Routes**:
- `/` - Landing page
- `/signin` - Sign in page
- `/signup` - Sign up page
- `/verify` - Phone verification page

#### Protected Route Component (`src/components/auth/ProtectedRoute.tsx`)

React component for client-side route protection:

```tsx
<ProtectedRoute redirectTo="/signin">
  <DashboardPage />
</ProtectedRoute>
```

**Features**:
- Shows loading state while checking auth
- Redirects to sign-in if not authenticated
- Prevents rendering protected content

### 5. API Routes

#### Authentication Endpoints

**POST /api/auth/signin**
- Authenticates user with Cognito
- Returns JWT tokens
- Input: `{ phoneNumber, password }`
- Output: `{ accessToken, idToken, refreshToken, expiresIn }`

**POST /api/auth/signup**
- Registers new user in Cognito
- Sends verification SMS
- Input: `{ phoneNumber, password, name }`
- Output: `{ success: true }`

**POST /api/auth/verify**
- Verifies phone number with OTP
- Confirms user registration
- Input: `{ phoneNumber, code }`
- Output: `{ success: true }`

**POST /api/auth/refresh**
- Refreshes access token
- Input: `{ refreshToken }`
- Output: `{ accessToken, idToken, refreshToken, expiresIn }`

## Security Features

### JWT Token Management

**Token Types**:
1. **Access Token**: Short-lived (1 hour), used for API authentication
2. **ID Token**: Contains user profile information
3. **Refresh Token**: Long-lived (30 days), used to obtain new access tokens

**Token Flow**:
1. User signs in → Receives all three tokens
2. Access token included in API requests
3. Before expiry → Automatically refreshed
4. On 401 error → Attempt token refresh
5. Refresh fails → Redirect to sign-in

**Storage**:
- Tokens stored in localStorage (client-side)
- Automatic cleanup on sign-out
- Validated on app initialization

### Rate Limiting

**API Gateway Limits**:
- 100 requests per second per user
- 200 burst capacity
- Retry-After header on 429 errors

**Client-Side Handling**:
- Detects rate limit errors
- Respects Retry-After header
- Shows user-friendly error messages

### Password Security

**Requirements**:
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one digit
- No special characters required (accessibility)

**Validation**:
- Client-side validation before submission
- Server-side validation in Cognito
- Clear error messages for users

## Configuration

### Environment Variables

Create `.env.local` from `.env.local.example`:

```bash
# API Gateway
NEXT_PUBLIC_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/

# Cognito
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1

# S3
NEXT_PUBLIC_PHOTO_BUCKET=shelf-bidder-photos-xxxxxxxxxxxx

# DynamoDB (server-side only)
DYNAMODB_SHOPKEEPERS_TABLE=ShelfBidder-Shopkeepers
DYNAMODB_SHELF_SPACES_TABLE=ShelfBidder-ShelfSpaces
DYNAMODB_AUCTIONS_TABLE=ShelfBidder-Auctions
DYNAMODB_TASKS_TABLE=ShelfBidder-Tasks
DYNAMODB_TRANSACTIONS_TABLE=ShelfBidder-Transactions
```

### Automatic Configuration Export

After deploying infrastructure, run:

```bash
cd infrastructure
./scripts/export-config.sh
```

This script:
1. Fetches CDK stack outputs
2. Creates `.env.local` file
3. Populates all required variables

## Deployment

### 1. Deploy Infrastructure

```bash
cd infrastructure
npm install
npm run build
cdk deploy
```

This creates:
- Cognito User Pool
- API Gateway with authorizer
- DynamoDB tables
- S3 buckets
- All necessary IAM roles

### 2. Export Configuration

```bash
cd infrastructure
chmod +x scripts/export-config.sh
./scripts/export-config.sh
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

## Usage Examples

### Sign Up Flow

```typescript
'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useState } from 'react';

export function SignUpForm() {
  const { signUp, verifyPhoneNumber, signIn } = useAuth();
  const [step, setStep] = useState<'signup' | 'verify' | 'complete'>('signup');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSignUp = async () => {
    try {
      await signUp(phoneNumber, password, name);
      setStep('verify');
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  const handleVerify = async (code: string) => {
    try {
      await verifyPhoneNumber(phoneNumber, code);
      await signIn(phoneNumber, password);
      setStep('complete');
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  // Render form based on step...
}
```

### Protected API Request

```typescript
import { get } from '@/lib/api/client';

async function fetchShopkeeperProfile() {
  try {
    const profile = await get('/shopkeepers/profile');
    return profile;
  } catch (error) {
    if (error.statusCode === 401) {
      // User not authenticated, redirect to sign-in
      window.location.href = '/signin';
    } else if (error.statusCode === 429) {
      // Rate limited, show error message
      console.error('Too many requests, please try again later');
    } else {
      console.error('Request failed:', error);
    }
  }
}
```

## Implementation Status

### ✅ Completed

- [x] AWS Cognito User Pool configuration
- [x] API Gateway with Cognito authorizer
- [x] Rate limiting configuration
- [x] Client-side authentication utilities
- [x] React Context for auth state
- [x] Authenticated API client
- [x] JWT token handling and refresh
- [x] Route protection middleware
- [x] Protected route component
- [x] API route handlers (structure)
- [x] Configuration export script
- [x] Documentation

### 🚧 Pending

- [ ] AWS SDK integration in API routes
- [ ] Full Cognito SDK implementation
- [ ] Unit tests for authentication
- [ ] Integration tests for auth flow
- [ ] Error handling improvements
- [ ] User feedback messages
- [ ] Sign-in/sign-up UI components

## Next Steps

1. **Add AWS SDK**:
   ```bash
   npm install @aws-sdk/client-cognito-identity-provider
   ```

2. **Implement Cognito SDK calls** in API routes

3. **Create UI components** for sign-in/sign-up

4. **Add tests** for authentication flows

5. **Deploy and test** end-to-end authentication

## Related Requirements

This implementation satisfies:
- **Requirement 9.1**: Data persistence with proper authentication
- **Design**: AWS Cognito for shopkeeper identity management
- **Design**: JWT token handling for secure API calls
- **Design**: API Gateway with authentication and rate limiting

## Security Considerations

1. **Token Storage**: Tokens stored in localStorage (acceptable for PWA, consider httpOnly cookies for enhanced security)
2. **HTTPS Only**: All API communication over HTTPS
3. **Rate Limiting**: Prevents abuse and DDoS attacks
4. **Token Expiry**: Short-lived access tokens (1 hour)
5. **Phone Verification**: Required for all new accounts
6. **Password Policy**: Balanced security and usability for low-tech users

## Troubleshooting

### "Not authenticated" errors
- Check if tokens are stored in localStorage
- Verify token expiry time
- Try signing in again

### "Rate limit exceeded" errors
- Wait for the Retry-After period
- Reduce request frequency
- Check for infinite loops in code

### "Invalid token" errors
- Token may be expired
- Try refreshing the token
- Sign in again if refresh fails

### Configuration errors
- Verify all environment variables are set
- Run `export-config.sh` script
- Check CDK stack outputs match .env.local
