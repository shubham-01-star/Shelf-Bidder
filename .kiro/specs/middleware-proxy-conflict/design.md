# Middleware Proxy Conflict Bugfix Design

## Overview

Next.js detects multiple middleware files (`./middleware.ts`, `./src/middleware.ts`, and `./src/proxy.ts`), causing a conflict error that requires using only `./src/proxy.ts`. This design consolidates all middleware functionality (authentication, CORS, security headers) from the three separate files into a single `./src/proxy.ts` file, eliminating the conflict while preserving all existing behavior.

The fix involves merging the authentication logic from `./src/proxy.ts`, the CORS handling from `./src/middleware.ts`, and the security headers from `./middleware.ts` into one cohesive middleware implementation, then removing the conflicting files.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when multiple middleware files exist simultaneously
- **Property (P)**: The desired behavior - a single `./src/proxy.ts` file that handles all middleware concerns without conflicts
- **Preservation**: All existing authentication, CORS, and security header functionality that must remain unchanged
- **proxy function**: The main middleware function in `./src/proxy.ts` that Next.js will execute for matching routes
- **middleware function**: The conflicting function names in `./middleware.ts` and `./src/middleware.ts` that must be consolidated
- **matcher config**: The route pattern configuration that determines which requests trigger middleware execution

## Bug Details

### Bug Condition

The bug manifests when Next.js detects multiple middleware files in the project. Next.js has specific rules about middleware file locations and names, and the presence of both `middleware.ts` and `proxy.ts` in the `./src` directory violates these rules, causing a startup error.

**Formal Specification:**
```
FUNCTION isBugCondition(projectState)
  INPUT: projectState containing file system state
  OUTPUT: boolean
  
  RETURN (fileExists('./src/middleware.ts') AND fileExists('./src/proxy.ts'))
         OR (fileExists('./middleware.ts') AND fileExists('./src/proxy.ts'))
         OR (fileExists('./middleware.ts') AND fileExists('./src/middleware.ts'))
END FUNCTION
```

### Examples

- **Example 1**: Application startup with all three files present
  - Expected: Application starts successfully with consolidated middleware
  - Actual: Error "Both middleware file './src\middleware.ts' and proxy file './src\proxy.ts' are detected. Please use './src\proxy.ts' only."

- **Example 2**: API request to `/api/users` with valid auth token
  - Expected: Request passes authentication, receives CORS headers and security headers
  - Actual: Unclear which middleware executes; potential for missing headers or auth checks

- **Example 3**: Preflight OPTIONS request to `/api/data`
  - Expected: Returns 204 with CORS headers
  - Actual: May not be handled correctly due to middleware conflict

- **Edge Case**: Request to public route `/api/auth/signin`
  - Expected: Bypasses authentication but still receives CORS and security headers

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Authentication checks for protected API routes must continue to verify Authorization headers and auth_token cookies
- Public API routes (`/api/auth/signin`, `/api/auth/signup`, `/api/auth/verify`, `/api/brand/auth`, `/api/health`) must continue to allow access without authentication
- CORS headers must continue to be added for allowed origins (localhost in dev, production domains in prod)
- Preflight OPTIONS requests must continue to return 204 status with CORS headers
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy) must continue to be set on all responses
- Content-Security-Policy must continue to be enforced in production mode only
- Static files, images, and public assets must continue to be excluded from middleware processing
- Development mode must continue to allow localhost and 127.0.0.1 origins for CORS

**Scope:**
All requests that currently pass through any of the three middleware files should be completely unaffected by this consolidation. This includes:
- API requests with authentication
- API requests without authentication (public routes)
- Preflight OPTIONS requests
- Static asset requests (should continue to bypass middleware)
- Page navigation requests

## Hypothesized Root Cause

Based on the bug description and file analysis, the root cause is clear:

1. **Multiple Middleware Files**: Next.js only supports one middleware file per project, and the framework has specific precedence rules. Having both `middleware.ts` and `proxy.ts` in `./src` violates this constraint.

2. **Historical Evolution**: The three files likely evolved separately:
   - `./middleware.ts` was created first for security headers
   - `./src/middleware.ts` was added later for CORS handling
   - `./src/proxy.ts` was created for authentication, possibly to replace the others

3. **Incomplete Migration**: The presence of all three files suggests an incomplete migration where new functionality was added without removing old files.

4. **Next.js Naming Convention**: Next.js prefers `proxy.ts` over `middleware.ts` when both exist, as indicated by the error message directing users to use `proxy.ts` only.

## Correctness Properties

Property 1: Bug Condition - Single Middleware File

_For any_ project state where middleware functionality is required, the fixed codebase SHALL contain only the file `./src/proxy.ts` with no conflicting `./middleware.ts` or `./src/middleware.ts` files present, and the application SHALL start without file conflict errors.

**Validates: Requirements 2.1, 2.3**

Property 2: Preservation - Complete Functionality

_For any_ HTTP request that previously passed through any of the three middleware files, the consolidated `./src/proxy.ts` SHALL apply the same authentication checks, CORS headers, and security headers as the original files, preserving all existing middleware behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

The fix involves consolidating functionality and removing duplicate files.

**File**: `./src/proxy.ts`

**Function**: `proxy` (rename to `middleware` per Next.js convention)

**Specific Changes**:

1. **Merge Authentication Logic**: Keep the existing authentication logic from `./src/proxy.ts`
   - Preserve PUBLIC_API_ROUTES array
   - Preserve Authorization header and auth_token cookie checking
   - Preserve 401 response for unauthorized requests

2. **Add CORS Functionality**: Import CORS logic from `./src/middleware.ts`
   - Add ALLOWED_ORIGINS configuration
   - Add isOriginAllowed() helper function
   - Add addCorsHeaders() helper function
   - Handle preflight OPTIONS requests with 204 response
   - Apply CORS headers to API routes

3. **Add Security Headers**: Import security header logic from both middleware files
   - Add addSecurityHeaders() helper function
   - Include all headers: X-DNS-Prefetch-Control, Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
   - Add Content-Security-Policy for production only
   - Merge CSP policies from both files (use the more comprehensive one)

4. **Rename Function**: Change `proxy` to `middleware` to follow Next.js conventions

5. **Update Matcher Config**: Consolidate matcher patterns from all three files
   - Exclude: _next/static, _next/image, favicon.ico, manifest.json, sw.js, workbox files, icon files, image extensions
   - Use the most comprehensive pattern that covers all exclusions

6. **Execution Order**: Ensure proper execution order in the consolidated function:
   - First: Handle OPTIONS preflight (return early with CORS headers)
   - Second: Check authentication for protected API routes (return 401 if unauthorized)
   - Third: Add CORS headers to API responses
   - Fourth: Add security headers to all responses
   - Finally: Return the response

**Files to Delete**:
- `./middleware.ts`
- `./src/middleware.ts`

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the bug exists with multiple files present, then verify the consolidated file works correctly and preserves all existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Confirm the bug exists BEFORE implementing the fix by attempting to start the application with all three middleware files present.

**Test Plan**: Run the Next.js development server with all three files present and observe the error message. Document the exact error to confirm our understanding of the bug condition.

**Test Cases**:
1. **Startup Error Test**: Start Next.js with all three files present (will fail with conflict error)
2. **File Detection Test**: Verify Next.js detects both `./src/middleware.ts` and `./src/proxy.ts` (will fail on unfixed code)
3. **Unclear Execution Test**: Make an API request and attempt to determine which middleware executed (will be ambiguous on unfixed code)

**Expected Counterexamples**:
- Application fails to start with error: "Both middleware file './src\middleware.ts' and proxy file './src\proxy.ts' are detected. Please use './src\proxy.ts' only."
- Middleware execution order is undefined when multiple files exist

### Fix Checking

**Goal**: Verify that after consolidation, the application starts without errors and only one middleware file exists.

**Pseudocode:**
```
FOR ALL projectState WHERE isBugCondition(projectState) DO
  projectState_fixed := consolidateMiddleware(projectState)
  ASSERT NOT fileExists('./middleware.ts')
  ASSERT NOT fileExists('./src/middleware.ts')
  ASSERT fileExists('./src/proxy.ts')
  ASSERT applicationStartsSuccessfully(projectState_fixed)
END FOR
```

### Preservation Checking

**Goal**: Verify that all middleware functionality (authentication, CORS, security headers) continues to work exactly as before.

**Pseudocode:**
```
FOR ALL request WHERE middlewareApplies(request) DO
  response_original := executeOriginalMiddleware(request)
  response_fixed := executeConsolidatedMiddleware(request)
  ASSERT response_original.headers = response_fixed.headers
  ASSERT response_original.status = response_fixed.status
  ASSERT response_original.body = response_fixed.body
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many request variations automatically (different routes, headers, methods)
- It catches edge cases like missing headers or incorrect CORS handling
- It provides strong guarantees that behavior is unchanged across the entire request domain

**Test Plan**: Before making changes, document the current behavior by making various requests and recording responses. After consolidation, verify identical behavior.

**Test Cases**:
1. **Authentication Preservation**: Verify protected API routes still require auth tokens
2. **Public Route Preservation**: Verify public routes still work without authentication
3. **CORS Preservation**: Verify CORS headers are still added for allowed origins
4. **Security Headers Preservation**: Verify all security headers are still present
5. **OPTIONS Handling Preservation**: Verify preflight requests still return 204 with CORS headers
6. **Static Asset Preservation**: Verify static files still bypass middleware

### Unit Tests

- Test authentication logic for protected vs public API routes
- Test CORS header addition for allowed and disallowed origins
- Test security header addition in development vs production mode
- Test OPTIONS request handling with proper 204 response
- Test matcher configuration excludes correct file patterns
- Test execution order: OPTIONS → Auth → CORS → Security Headers

### Property-Based Tests

- Generate random API routes and verify authentication is checked correctly
- Generate random origins and verify CORS headers are added appropriately
- Generate random request methods and verify OPTIONS is handled specially
- Generate random paths and verify matcher configuration works correctly
- Test that all responses include security headers regardless of route

### Integration Tests

- Test full request flow: client → middleware → API route → response
- Test authentication flow: valid token → success, invalid token → 401
- Test CORS flow: preflight OPTIONS → 204, actual request → CORS headers
- Test security headers appear on all responses (API and pages)
- Test development vs production mode differences (CSP, CORS origins)
- Test that removing old middleware files doesn't break any existing functionality
