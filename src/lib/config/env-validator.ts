/**
 * Environment Variable Validator
 * 
 * Ensures all required environment variables are present at startup.
 * Throws a clear error if anything is missing, preventing cryptic runtime failures.
 */

const REQUIRED_SERVER_VARS = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'PHOTO_BUCKET_NAME',
] as const;

const REQUIRED_PUBLIC_VARS = [
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
  'NEXT_PUBLIC_COGNITO_CLIENT_ID',
] as const;

export function validateEnv() {
  // Skip execution during build phase
  if (process.env.npm_lifecycle_event === 'build') {
    return true;
  }

  const missingServer = REQUIRED_SERVER_VARS.filter(key => !process.env[key]);
  const missingPublic = REQUIRED_PUBLIC_VARS.filter(key => !process.env[key]);

  const missing = [...missingServer, ...missingPublic];

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production' && !process.env.SKIP_ENV_VALIDATION) {
      throw new Error(
        `❌ Invalid environment variables. Missing: ${missing.join(', ')}.\n` +
        `Please check your deployment environment configuration.`
      );
    } else {
      console.warn(
        `⚠️ Warning: Missing environment variables for local development: ${missing.join(', ')}.\n` +
        `Some features (like AWS Bedrock or DB access) may fail. Check .env.example.`
      );
    }
  }

  return true;
}

// Call this immediately so we fail fast during build/startup
if (typeof window === 'undefined') {
  validateEnv();
}
