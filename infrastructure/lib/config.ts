/**
 * Configuration constants for Shelf-Bidder infrastructure
 */

export const Config = {
  // DynamoDB Table Names
  tables: {
    shopkeepers: 'ShelfBidder-Shopkeepers',
    shelfSpaces: 'ShelfBidder-ShelfSpaces',
    auctions: 'ShelfBidder-Auctions',
    tasks: 'ShelfBidder-Tasks',
    transactions: 'ShelfBidder-Transactions',
  },

  // S3 Configuration
  s3: {
    photoBucketPrefix: 'shelf-bidder-photos',
    maxPhotoSize: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // API Gateway Configuration
  api: {
    throttling: {
      rateLimit: 100, // requests per second
      burstLimit: 200,
    },
  },

  // Cognito Configuration
  cognito: {
    passwordPolicy: {
      minLength: 8,
      requireLowercase: true,
      requireUppercase: true,
      requireDigits: true,
      requireSymbols: false,
    },
  },

  // Multi-region Configuration
  regions: {
    primary: 'ap-south-1',
  },

  // Lifecycle Policies
  lifecycle: {
    photoRetentionDays: 90,
    transitionToIADays: 30,
  },
} as const;
