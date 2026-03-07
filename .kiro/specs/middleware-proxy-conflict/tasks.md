# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Multiple Middleware Files Conflict
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case - all three middleware files present
  - Test that when `./middleware.ts`, `./src/middleware.ts`, and `./src/proxy.ts` all exist, Next.js fails to start with a conflict error
  - Test that isBugCondition(projectState) returns true when multiple middleware files are detected
  - The test assertions should verify: only `./src/proxy.ts` exists, no `./middleware.ts`, no `./src/middleware.ts`, and application starts successfully
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: "Application fails to start with error about multiple middleware files detected"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Complete Middleware Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for various request types (protected API routes, public routes, CORS requests, OPTIONS preflight, security headers)
  - Write property-based tests capturing observed behavior patterns:
    - Authentication checks for protected API routes verify Authorization headers and auth_token cookies
    - Public API routes (`/api/auth/signin`, `/api/auth/signup`, `/api/auth/verify`, `/api/brand/auth`, `/api/health`) allow access without authentication
    - CORS headers are added for allowed origins (localhost in dev, production domains in prod)
    - Preflight OPTIONS requests return 204 status with CORS headers
    - Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy) are set on all responses
    - Content-Security-Policy is enforced in production mode only
    - Static files, images, and public assets are excluded from middleware processing
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code (may need to temporarily resolve conflict to observe behavior)
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Consolidate middleware files into single ./src/proxy.ts
  - [x] 3.1 Merge all middleware functionality into ./src/proxy.ts
    - Keep existing authentication logic from `./src/proxy.ts` (PUBLIC_API_ROUTES, Authorization header and auth_token cookie checking, 401 responses)
    - Add CORS functionality from `./src/middleware.ts` (ALLOWED_ORIGINS, isOriginAllowed(), addCorsHeaders(), OPTIONS preflight handling)
    - Add security headers from both middleware files (addSecurityHeaders() with all headers: X-DNS-Prefetch-Control, Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, Content-Security-Policy for production)
    - Rename `proxy` function to `middleware` to follow Next.js conventions
    - Update matcher config to consolidate exclusion patterns from all three files
    - Ensure proper execution order: OPTIONS preflight → Authentication → CORS headers → Security headers
    - _Bug_Condition: isBugCondition(projectState) where fileExists('./middleware.ts') AND fileExists('./src/middleware.ts') AND fileExists('./src/proxy.ts')_
    - _Expected_Behavior: Only ./src/proxy.ts exists with all consolidated functionality, application starts without conflict errors_
    - _Preservation: All authentication, CORS, and security header functionality preserved as specified in Preservation Requirements_
    - _Requirements: 2.1, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 3.2 Delete conflicting middleware files
    - Delete `./middleware.ts`
    - Delete `./src/middleware.ts`
    - Verify only `./src/proxy.ts` remains
    - _Requirements: 2.1, 2.3_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Single Middleware File
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - only ./src/proxy.ts exists, application starts successfully)
    - _Requirements: 2.1, 2.3_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Complete Middleware Functionality
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions - all authentication, CORS, and security header functionality preserved)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 4. Checkpoint - Ensure all tests pass
  - Verify bug condition test passes (application starts with single middleware file)
  - Verify preservation tests pass (all middleware functionality preserved)
  - Ensure no regressions in authentication, CORS, or security headers
  - Ask the user if questions arise
