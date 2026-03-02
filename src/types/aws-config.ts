/**
 * AWS Infrastructure Configuration Types
 * These types match the CDK stack outputs and environment variables
 */

export interface AWSConfig {
  // API Gateway
  apiUrl: string;
  
  // Cognito
  userPoolId: string;
  userPoolClientId: string;
  region: string;
  
  // S3
  photoBucket: string;
  
  // DynamoDB Tables (server-side only)
  tables: {
    shopkeepers: string;
    shelfSpaces: string;
    auctions: string;
    tasks: string;
    transactions: string;
  };
  
  // Resend
  resendApiKey?: string;
}

/**
 * Get AWS configuration from environment variables.
 * In local development (when NEXT_PUBLIC_USER_POOL_ID contains 'localDev' or is a placeholder),
 * missing vars will use safe fallbacks instead of throwing.
 */
export function getAWSConfig(): AWSConfig {
  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || '';
  const isLocalDev =
    typeof window !== 'undefined'
      ? process.env.NODE_ENV !== 'production'
      : process.env.NODE_ENV !== 'production';
  const isPlaceholderPool = !userPoolId || userPoolId.includes('localDev');

  // In local dev with placeholder pool, return config with available values
  // instead of throwing — the auth flow will use mock API routes anyway.
  if (isLocalDev && isPlaceholderPool) {
    return {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
      userPoolId: userPoolId || 'us-east-1_localDevPool',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || 'localDevClientId',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      photoBucket: process.env.NEXT_PUBLIC_PHOTO_BUCKET || 'shelf-bidder-photos-local-dev',
      tables: {
        shopkeepers: process.env.DYNAMODB_SHOPKEEPERS_TABLE || 'ShelfBidder-Shopkeepers',
        shelfSpaces: process.env.DYNAMODB_SHELF_SPACES_TABLE || 'ShelfBidder-ShelfSpaces',
        auctions: process.env.DYNAMODB_AUCTIONS_TABLE || 'ShelfBidder-Auctions',
        tasks: process.env.DYNAMODB_TASKS_TABLE || 'ShelfBidder-Tasks',
        transactions: process.env.DYNAMODB_TRANSACTIONS_TABLE || 'ShelfBidder-Transactions',
      },
      resendApiKey: process.env.RESEND_API_KEY,
    };
  }

  // Production: validate required vars and throw if missing
  const requiredVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_USER_POOL_ID',
    'NEXT_PUBLIC_AWS_REGION',
    'NEXT_PUBLIC_PHOTO_BUCKET',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  // Don't throw if we are in local dev with missing vars, just log a warning.
  // This allows the app to start and use mock API routes if no real AWS config is provided.
  if (missing.length > 0) {
    if (isLocalDev) {
      console.warn(
        `[Dev Warning] Missing AWS environment variables: ${missing.join(', ')}. ` +
        'Using fallback values for local development.'
      );
      return {
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
        userPoolId: 'us-east-1_localDevPool',
        userPoolClientId: 'localDevClientId',
        region: 'us-east-1',
        photoBucket: 'shelf-bidder-photos-local-dev',
        tables: {
          shopkeepers: 'ShelfBidder-Shopkeepers',
          shelfSpaces: 'ShelfBidder-ShelfSpaces',
          auctions: 'ShelfBidder-Auctions',
          tasks: 'ShelfBidder-Tasks',
          transactions: 'ShelfBidder-Transactions',
        },
      };
    } else {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Run: cd infrastructure && ./scripts/export-config.sh'
      );
    }
  }

  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
    userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
    region: process.env.NEXT_PUBLIC_AWS_REGION!,
    photoBucket: process.env.NEXT_PUBLIC_PHOTO_BUCKET!,
    tables: {
      shopkeepers: process.env.DYNAMODB_SHOPKEEPERS_TABLE || '',
      shelfSpaces: process.env.DYNAMODB_SHELF_SPACES_TABLE || '',
      auctions: process.env.DYNAMODB_AUCTIONS_TABLE || '',
      tasks: process.env.DYNAMODB_TASKS_TABLE || '',
      transactions: process.env.DYNAMODB_TRANSACTIONS_TABLE || '',
    },
    resendApiKey: process.env.RESEND_API_KEY,
  };
}

/**
 * DynamoDB Table Names
 */
export const TableNames = {
  SHOPKEEPERS: 'ShelfBidder-Shopkeepers',
  SHELF_SPACES: 'ShelfBidder-ShelfSpaces',
  AUCTIONS: 'ShelfBidder-Auctions',
  TASKS: 'ShelfBidder-Tasks',
  TRANSACTIONS: 'ShelfBidder-Transactions',
} as const;

/**
 * S3 Configuration
 */
export const S3Config = {
  MAX_PHOTO_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  PHOTO_FOLDER_PREFIX: 'shelf-photos/',
  PROOF_FOLDER_PREFIX: 'proof-photos/',
} as const;

/**
 * API Configuration
 */
export const APIConfig = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;
