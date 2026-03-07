# Bugfix Requirements Document

## Introduction

Next.js detects both `./src/middleware.ts` and `./src/proxy.ts` files, causing a conflict error: "Both middleware file './src\middleware.ts' and proxy file './src\proxy.ts' are detected. Please use './src\proxy.ts' only."

Additionally, a root-level `./middleware.ts` file exists that provides security headers functionality. This creates confusion about which middleware is active and results in Next.js requiring the use of proxy.ts exclusively.

The fix must consolidate the functionality from all three files into a single `./src/proxy.ts` file that Next.js can use without conflicts, while preserving all existing security headers, CORS handling, and authentication logic.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Next.js application starts with both `./src/middleware.ts` and `./src/proxy.ts` present THEN the system throws an error "Both middleware file './src\middleware.ts' and proxy file './src\proxy.ts' are detected. Please use './src\proxy.ts' only."

1.2 WHEN three separate middleware files exist (`./middleware.ts`, `./src/middleware.ts`, `./src/proxy.ts`) THEN the system has conflicting and unclear middleware execution order

1.3 WHEN the application attempts to use middleware functionality THEN it is unclear which file's logic is actually being executed

### Expected Behavior (Correct)

2.1 WHEN the Next.js application starts THEN the system SHALL use only `./src/proxy.ts` without any file conflict errors

2.2 WHEN middleware executes THEN the system SHALL apply all necessary functionality (authentication, CORS, security headers) from a single consolidated `./src/proxy.ts` file

2.3 WHEN the application runs THEN the system SHALL have no duplicate or conflicting middleware files (`./middleware.ts` and `./src/middleware.ts` SHALL be removed)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN API routes require authentication THEN the system SHALL CONTINUE TO check Authorization headers and auth_token cookies

3.2 WHEN public API routes are accessed (`/api/auth/signin`, `/api/auth/signup`, `/api/auth/verify`, `/api/brand/auth`, `/api/health`) THEN the system SHALL CONTINUE TO allow access without authentication

3.3 WHEN API routes are accessed with valid CORS origins THEN the system SHALL CONTINUE TO add appropriate CORS headers (Access-Control-Allow-Origin, Access-Control-Allow-Credentials, Access-Control-Allow-Methods, Access-Control-Allow-Headers)

3.4 WHEN preflight OPTIONS requests are made THEN the system SHALL CONTINUE TO respond with 204 status and CORS headers

3.5 WHEN any response is generated THEN the system SHALL CONTINUE TO include security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, Content-Security-Policy in production)

3.6 WHEN requests are made to static files, images, or public assets THEN the system SHALL CONTINUE TO exclude them from middleware processing via the matcher configuration

3.7 WHEN the application runs in development mode THEN the system SHALL CONTINUE TO allow localhost and 127.0.0.1 origins for CORS

3.8 WHEN the application runs in production mode THEN the system SHALL CONTINUE TO enforce strict Content-Security-Policy headers
