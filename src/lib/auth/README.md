# Authentication System

This directory contains the current Shelf-Bidder authentication flow: PostgreSQL-backed users, bcrypt-hashed passwords, and signed JWT access/refresh tokens.

## Architecture

The active auth stack is:

1. PostgreSQL user records for shopkeepers and brands
2. Bcrypt password hashing with one-time legacy plain-text migration
3. Signed JWT access tokens and refresh tokens
4. HttpOnly cookies plus client token storage for frontend compatibility
5. Route protection through server-side token verification

## Main Files

### `client-auth.ts`
Client-side auth utilities:
- `signIn()` and `signUp()`
- `verifyPhoneNumber()`
- `signOut()`
- `refreshAccessToken()`
- JWT decode helpers and token storage

### `tokens.ts`
Server-side token creation and verification:
- signs access and refresh tokens
- verifies expiry and token type
- rotates refresh tokens

### `server-auth.ts`
Reads cookies or authorization headers and returns the authenticated user context for API routes and middleware.

### `AuthContext.tsx`
Client auth state management:
- stores current user
- refreshes tokens when needed
- exposes auth actions to the UI

### API Routes (`/app/api/auth/`)
- `POST /api/auth/signin`
- `POST /api/auth/signup`
- `POST /api/auth/verify`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

## Security Model

- Passwords are stored as bcrypt hashes
- Access tokens are short-lived
- Refresh tokens are rotated on refresh
- API routes verify token signatures and expiry
- Auth cookies are `HttpOnly` and `Secure` in production

## Environment Variables

For local development, set these in `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
AUTH_JWT_SECRET=replace-me
AUTH_REFRESH_SECRET=replace-me
```

For EC2 Docker deployment, set the same auth secrets in `.env.ec2`.

No Cognito setup is required for the active app runtime.

## Related Files

- `/src/lib/auth/client-auth.ts` - client auth helpers
- `/src/lib/auth/tokens.ts` - JWT signing and verification
- `/src/lib/auth/server-auth.ts` - server auth context
- `/src/lib/api/client.ts` - authenticated API client
- `/src/proxy.ts` - route protection
