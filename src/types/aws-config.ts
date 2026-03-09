/**
 * Client runtime configuration derived from environment variables.
 */

export interface AWSConfig {
  apiUrl: string;
  region: string;
  photoBucket: string;
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
 * Get client/runtime configuration from environment variables.
 */
export function getAWSConfig(): AWSConfig {
  const isLocalDev =
    typeof window !== 'undefined'
      ? process.env.NODE_ENV !== 'production'
      : process.env.NODE_ENV !== 'production';

  if (isLocalDev) {
    return {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
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

  const requiredVars = ['NEXT_PUBLIC_API_URL'];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Set NEXT_PUBLIC_API_URL in your runtime env.'
    );
  }

  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1',
    photoBucket:
      process.env.NEXT_PUBLIC_PHOTO_BUCKET ||
      process.env.NEXT_PUBLIC_PHOTO_BUCKET_NAME ||
      '',
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
