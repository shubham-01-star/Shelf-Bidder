# Authentication and Security Documentation

## Overview

Shelf-Bidder implements a comprehensive authentication and security system using JWT-based authentication with AWS Cognito, rate limiting, and CORS policies for PWA access.

## Authentication System

### JWT-Based Authentication

The system uses JSON Web Tokens (JWT) for stateless authentication:

- **Access Token**: Short-lived token (1 hour) for API authentication
- **ID Token**: Contains user profile information
- **Refresh Token**: Long-lived token for obtaining new access tokens

### AWS Cognito Integration

Authentication is handled by AWS Cognito User Pools:

- **User Pool**: Manages user accounts and authentication
- **User Pool Client**: Configured for USER_PASSWORD_AUTH flow
- **Phone Number**: Used as username (E.164 format: +919876543210)
- **OTP Verification**: Email-based verification codes via Resend

### Authentication Flow

#### Sign Up Flow

1. User submits phone number, email, password, and name
2. System creates user in Cognito (UNCONFIRMED status)
3. OTP code generated and sent via email
4. OTP stored temporarily in memory with 10-minute expiration
5. User verifies with OTP code
6. System confirms user in Cognito using AdminConfirmSignUp
7. Shopkeeper record created in DynamoDB with Cognito sub as ID

#### Sign In Flow

1. User submits phone number and password
2. System authenticates with Cognito using InitiateAuth
3. Cognito returns access, ID, and refresh tokens
4. Tokens stored in localStorage with expiration time
5. User profile decoded from ID token and stored
6. User redirected to dashboard

#### Token Refresh Flow

1. Client detects token expiration (1 minute before expiry)
2. Client calls /api/auth/refresh with refresh token
3. System uses Cognito REFRESH_TOKEN_AUTH flow
4. Cognito returns new access and ID tokens
5. Refresh token may be rotated (new one provided)
6. New tokens stored and used for subsequent requests

### API Endpoints

#### POST /api/auth/signup
Creates a new shopkeeper account.

**Request:**
```json
{
  "phoneNumber": "+919876543210",
  "email": "ramesh@example.com",
  "password": "SecurePass123!",
  "name": "Ramesh Kumar"
}
```

**Response:**
```json
{
  "message": "Account created successfully. Please check your email for the verification code.",
  "emailSent": true,
  "otpInConsole": true
}
```

#### POST /api/auth/verify
Verifies phone number with OTP code.

**Request:**
```json
{
  "phoneNumber": "+919876543210",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Account verified successfully."
}
```

#### POST /api/auth/signin
Authenticates a shopkeeper.

**Request:**
```json
{
  "phoneNumber": "+919876543210",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "idToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600
}
```

#### POST /api/auth/refresh
Refreshes access and ID tokens.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "idToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600
}
```

## Security Measures

### Refresh Token Rotation

The system implements refresh token rotation for enhanced security:

- When a refresh token is used, Cognito may issue a new refresh token
- Old refresh token becomes invalid after use (if rotated)
- Prevents token replay attacks
- Limits damage from stolen refresh tokens

### Rate Limiting

Rate limiting protects API endpoints from abuse:

#### Rate Limit Tiers

- **Authentication endpoints** (`/api/auth/*`): 5 requests per minute
- **General API endpoints**: 100 requests per minute
- **File upload endpoints**: 10 requests per minute
- **Strict operations**: 3 requests per minute

#### Implementation

Rate limiting uses an in-memory token bucket algorithm:

```typescript
import { rateLimiters } from '@/lib/middleware';

// Apply rate limiting to an endpoint
export async function POST(request: NextRequest) {
  const limitResponse = await rateLimiters.auth(request);
  if (limitResponse) return limitResponse;
  
  // Handle request...
}
```

#### Rate Limit Headers

When rate limited, responses include:

- `Retry-After`: Seconds until limit resets
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Timestamp when limit resets

#### Production Considerations

For production with multiple servers, replace in-memory storage with Redis:

```typescript
// Example Redis-based rate limiter
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimit(key: string, limit: number, window: number) {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, window);
  }
  return current <= limit;
}
```

### CORS Policies

CORS (Cross-Origin Resource Sharing) is configured for PWA access:

#### Allowed Origins

- Development: `http://localhost:3000`, `http://127.0.0.1:3000`
- Production: Configured domains (e.g., `https://shelf-bidder.vercel.app`)

#### CORS Headers

- `Access-Control-Allow-Origin`: Allowed origin (dynamic)
- `Access-Control-Allow-Credentials`: `true` (for cookies/auth)
- `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type, Authorization, X-Requested-With`
- `Access-Control-Max-Age`: `86400` (24 hours)

#### Implementation

CORS is handled by Next.js middleware (`src/middleware.ts`):

```typescript
// Middleware automatically adds CORS headers to API routes
// Handles preflight OPTIONS requests
// Validates origin against allowed list
```

### Security Headers

The following security headers are applied to all responses:

#### X-Frame-Options
```
X-Frame-Options: SAMEORIGIN
```
Prevents clickjacking by disallowing the site to be embedded in iframes from other origins.

#### X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
Prevents MIME type sniffing, forcing browsers to respect declared content types.

#### X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
Enables browser XSS filtering and blocks pages if XSS is detected.

#### Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
Controls how much referrer information is sent with requests.

#### Permissions-Policy
```
Permissions-Policy: camera=*, geolocation=*, microphone=*
```
Controls which browser features the PWA can access.

#### Content-Security-Policy (Production)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ...
```
Restricts resource loading to prevent XSS and data injection attacks.

## Frontend Authentication

### AuthContext

React Context provides authentication state and methods:

```typescript
import { useAuth } from '@/lib/auth/AuthContext';

function MyComponent() {
  const { isAuthenticated, shopkeeper, signIn, signOut } = useAuth();
  
  // Use authentication state and methods
}
```

### Protected Routes

To protect routes, check authentication status:

```typescript
'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;
  
  return <div>Protected content</div>;
}
```

### Automatic Token Refresh

AuthContext automatically refreshes tokens:

- Checks token expiration on mount
- Sets timer to refresh 5 minutes before expiry
- Refreshes tokens in background
- Signs out user if refresh fails

### API Client

Use the authenticated API client for requests:

```typescript
import { get, post } from '@/lib/api/client';

// Automatically includes Authorization header
const data = await get('/api/profile');

// Automatically refreshes token if expired
const result = await post('/api/tasks', { taskId: '123' });
```

## Local Development

### Mock Authentication

In development without real Cognito:

- Mock users stored in memory
- Pre-seeded test user: `+919876543210` / `Test@1234`
- OTP codes logged to console
- Fake JWT tokens generated

### Environment Variables

Required for authentication:

```env
# AWS Cognito
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxx
AWS_REGION=us-east-1

# Resend (for OTP emails)
RESEND_API_KEY=re_xxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Best Practices

### Password Requirements

- Minimum 8 characters
- Must include uppercase, lowercase, numbers, and special characters (Cognito default)

### Token Storage

- Tokens stored in localStorage (client-side only)
- Never expose tokens in URLs or logs
- Clear tokens on sign out

### API Security

- All authenticated endpoints require valid JWT
- Tokens validated on every request
- Rate limiting prevents brute force attacks
- CORS prevents unauthorized cross-origin requests

### Production Checklist

- [ ] Configure production Cognito User Pool
- [ ] Set up production domain in CORS allowed origins
- [ ] Enable HTTPS for all API endpoints
- [ ] Implement Redis-based rate limiting for distributed systems
- [ ] Configure proper CSP headers
- [ ] Set up monitoring and alerting for auth failures
- [ ] Implement account lockout after failed attempts
- [ ] Enable MFA for sensitive operations
- [ ] Regular security audits and penetration testing

## Troubleshooting

### Common Issues

#### "Token refresh failed"
- Refresh token expired (typically 30 days)
- User needs to sign in again
- Check Cognito User Pool refresh token expiration settings

#### "Rate limit exceeded"
- Too many requests from same IP/user
- Wait for rate limit window to reset
- Check `Retry-After` header for wait time

#### "CORS error"
- Origin not in allowed list
- Add origin to `ALLOWED_ORIGINS` in `src/middleware.ts`
- Ensure credentials are included in requests

#### "Invalid verification code"
- OTP expired (10 minutes)
- Wrong code entered
- Request new code via resend

## Testing

### Manual Testing

1. Sign up with new phone number
2. Verify with OTP code from email/console
3. Sign in with credentials
4. Access protected routes
5. Wait for token to expire and verify auto-refresh
6. Sign out and verify tokens cleared

### Automated Testing

```bash
# Run authentication tests
npm test -- auth

# Test rate limiting
npm test -- rateLimit

# Test CORS
npm test -- cors
```

## References

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
