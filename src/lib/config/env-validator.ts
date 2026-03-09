/**
 * Environment Variable Validator
 * 
 * Ensures all required environment variables are present at startup.
 * Throws a clear error if anything is missing, preventing cryptic runtime failures.
 */

const REQUIRED_SERVER_VARS = ['DATABASE_URL', 'AUTH_JWT_SECRET', 'AUTH_REFRESH_SECRET'] as const;

const OPTIONAL_SERVER_VARS = ['AWS_REGION', 'PHOTO_BUCKET_NAME', 'S3_BUCKET_PHOTOS'] as const;
const REQUIRED_PUBLIC_VARS = ['NEXT_PUBLIC_APP_URL'] as const;

export function validateEnv() {
  // Skip execution during build phase
  if (process.env.npm_lifecycle_event === 'build') {
    return true;
  }

  const missingServer = REQUIRED_SERVER_VARS.filter(key => !process.env[key]);
  const missingPublic = REQUIRED_PUBLIC_VARS.filter(key => !process.env[key]);

  const missing = [...missingServer, ...missingPublic];
  const missingOptional = OPTIONAL_SERVER_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production' && !process.env.SKIP_ENV_VALIDATION) {
      throw new Error(
        `❌ Invalid environment variables. Missing: ${missing.join(', ')}.\n` +
        `Please check your deployment environment configuration.`
      );
    } else {
      console.warn(
        `⚠️ Warning: Missing environment variables for local development: ${missing.join(', ')}.\n` +
        `Core runtime may fail. Check .env.example.`
      );
    }
  }

  if (missingOptional.length > 0) {
    console.warn(
      `⚠️ Optional environment variables missing: ${missingOptional.join(', ')}.\n` +
      `AWS-backed features may be unavailable until they are configured.`
    );
  }

  return true;
}

// Call this immediately so we fail fast during build/startup
if (typeof window === 'undefined') {
  validateEnv();
}
