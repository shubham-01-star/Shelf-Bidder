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
}

/**
 * Get AWS configuration from environment variables
 */
export function getAWSConfig(): AWSConfig {
  // Validate required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_USER_POOL_ID',
    'NEXT_PUBLIC_AWS_REGION',
    'NEXT_PUBLIC_PHOTO_BUCKET',
  ];

  const missing = requiredVars.filter(
    (varName) => !process.env[varName]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Run: cd infrastructure && ./scripts/export-config.sh'
    );
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
