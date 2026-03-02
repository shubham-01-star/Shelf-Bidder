/**
 * Staging environment configuration for Shelf-Bidder
 * Mirrors production but uses separate AWS resources for testing
 */

export const StagingConfig = {
  // Environment identifier
  environment: 'staging',

  // DynamoDB Table Names (staging-specific)
  tables: {
    shopkeepers: 'ShelfBidder-Staging-Shopkeepers',
    shelfSpaces: 'ShelfBidder-Staging-ShelfSpaces',
    auctions: 'ShelfBidder-Staging-Auctions',
    tasks: 'ShelfBidder-Staging-Tasks',
    transactions: 'ShelfBidder-Staging-Transactions',
  },

  // S3 Configuration
  s3: {
    photoBucketPrefix: 'shelf-bidder-staging-photos',
    maxPhotoSize: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // API Gateway Configuration
  api: {
    stageName: 'staging',
    throttling: {
      rateLimit: 50, // Lower limits for staging
      burstLimit: 100,
    },
  },

  // Cognito Configuration
  cognito: {
    userPoolName: 'ShelfBidder-Staging-Shopkeepers',
    passwordPolicy: {
      minLength: 8,
      requireLowercase: true,
      requireUppercase: true,
      requireDigits: true,
      requireSymbols: false,
    },
  },

  // Multi-region Configuration (staging uses single region)
  regions: {
    primary: 'us-east-1',
    // No replica for staging to reduce costs
  },

  // Lifecycle Policies (shorter retention for staging)
  lifecycle: {
    photoRetentionDays: 30, // Shorter retention for staging
    transitionToIADays: 7,
  },

  // Test data configuration
  testData: {
    enabled: true,
    shopkeeperCount: 5,
    mockBrandAgents: 3,
  },
} as const;
