/**
 * DynamoDB entity types and table configurations
 */

// ============================================================================
// Table Names - Load from environment with fallbacks
// ============================================================================

// Helper function to get table name with detailed logging
function getTableName(envKey1: string, envKey2: string | null, fallback: string): string {
  const value1 = process.env[envKey1];
  const value2 = envKey2 ? process.env[envKey2] : null;
  const result = value1 || value2 || fallback;
  
  console.log(`[TABLE_NAMES] 🔍 ${envKey1}:`, {
    env1: value1 || 'undefined',
    env2: value2 || 'undefined',
    result,
  });
  
  return result;
}

export const TABLE_NAMES = {
  SHOPKEEPERS: getTableName('DYNAMODB_TABLE_SHOPKEEPERS', 'DYNAMODB_SHOPKEEPERS_TABLE', 'ShelfBidder-Shopkeepers'),
  SHELF_SPACES: getTableName('DYNAMODB_SHELF_SPACES_TABLE', null, 'ShelfBidder-ShelfSpaces'),
  AUCTIONS: getTableName('DYNAMODB_AUCTIONS_TABLE', null, 'ShelfBidder-Auctions'),
  TASKS: getTableName('DYNAMODB_TASKS_TABLE', null, 'ShelfBidder-Tasks'),
  TRANSACTIONS: getTableName('DYNAMODB_TRANSACTIONS_TABLE', null, 'ShelfBidder-Transactions'),
} as const;

console.log('[TABLE_NAMES] ✅ Final table names:', TABLE_NAMES);

// ============================================================================
// DynamoDB Item Types
// ============================================================================

/**
 * Base DynamoDB item with partition and sort keys
 */
export interface DynamoDBItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  EntityType: string;
  CreatedAt: string;
  UpdatedAt: string;
}

/**
 * Shopkeeper DynamoDB item
 * PK: SHOPKEEPER#{shopkeeperId}
 * SK: METADATA
 */
export interface ShopkeeperItem extends DynamoDBItem {
  EntityType: 'SHOPKEEPER';
  shopkeeperId: string; // FIXED: lowercase to match DynamoDB table schema
  Name: string;
  PhoneNumber: string;
  StoreAddress: string;
  PreferredLanguage: string;
  Timezone: string;
  WalletBalance: number;
  RegistrationDate: string;
  LastActiveDate: string;
}

/**
 * ShelfSpace DynamoDB item
 * PK: SHOPKEEPER#{shopkeeperId}
 * SK: SHELFSPACE#{analysisDate}#{shelfSpaceId}
 * GSI1PK: SHELFSPACE#{shelfSpaceId}
 * GSI1SK: METADATA
 */
export interface ShelfSpaceItem extends DynamoDBItem {
  EntityType: 'SHELFSPACE';
  ShelfSpaceId: string;
  ShopkeeperId: string;
  PhotoUrl: string;
  AnalysisDate: string;
  EmptySpaces: string; // JSON stringified
  CurrentInventory: string; // JSON stringified
  AnalysisConfidence: number;
}

/**
 * Auction DynamoDB item
 * PK: AUCTION#{auctionId}
 * SK: METADATA
 * GSI1PK: SHELFSPACE#{shelfSpaceId}
 * GSI1SK: AUCTION#{startTime}
 * GSI2PK: STATUS#{status}
 * GSI2SK: AUCTION#{startTime}
 */
export interface AuctionItem extends DynamoDBItem {
  EntityType: 'AUCTION';
  AuctionId: string;
  ShelfSpaceId: string;
  StartTime: string;
  EndTime: string;
  Status: string;
  Bids: string; // JSON stringified
  WinnerId?: string;
  WinningBid?: number;
}

/**
 * Task DynamoDB item
 * PK: SHOPKEEPER#{shopkeeperId}
 * SK: TASK#{assignedDate}#{taskId}
 * GSI1PK: TASK#{taskId}
 * GSI1SK: METADATA
 * GSI2PK: STATUS#{status}
 * GSI2SK: TASK#{assignedDate}
 */
export interface TaskItem extends DynamoDBItem {
  EntityType: 'TASK';
  TaskId: string;
  AuctionId: string;
  ShopkeeperId: string;
  Instructions: string; // JSON stringified
  Status: string;
  AssignedDate: string;
  CompletedDate?: string;
  ProofPhotoUrl?: string;
  Earnings: number;
  VerificationResult?: string; // JSON stringified
}

/**
 * WalletTransaction DynamoDB item
 * PK: SHOPKEEPER#{shopkeeperId}
 * SK: TRANSACTION#{timestamp}#{transactionId}
 * GSI1PK: TRANSACTION#{transactionId}
 * GSI1SK: METADATA
 */
export interface WalletTransactionItem extends DynamoDBItem {
  EntityType: 'TRANSACTION';
  TransactionId: string;
  ShopkeeperId: string;
  Type: string;
  Amount: number;
  Description: string;
  TaskId?: string;
  Timestamp: string;
  Status: string;
}

// ============================================================================
// Access Pattern Types
// ============================================================================

export interface QueryOptions {
  limit?: number;
  startKey?: Record<string, any>;
  scanIndexForward?: boolean;
}

export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
  count: number;
}

// ============================================================================
// Key Builders
// ============================================================================

export const KeyBuilder = {
  shopkeeper: {
    pk: (shopkeeperId: string) => `SHOPKEEPER#${shopkeeperId}`,
    sk: () => 'METADATA',
  },
  shelfSpace: {
    pk: (shopkeeperId: string) => `SHOPKEEPER#${shopkeeperId}`,
    sk: (analysisDate: string, shelfSpaceId: string) =>
      `SHELFSPACE#${analysisDate}#${shelfSpaceId}`,
    gsi1pk: (shelfSpaceId: string) => `SHELFSPACE#${shelfSpaceId}`,
    gsi1sk: () => 'METADATA',
  },
  auction: {
    pk: (auctionId: string) => `AUCTION#${auctionId}`,
    sk: () => 'METADATA',
    gsi1pk: (shelfSpaceId: string) => `SHELFSPACE#${shelfSpaceId}`,
    gsi1sk: (startTime: string) => `AUCTION#${startTime}`,
    gsi2pk: (status: string) => `STATUS#${status}`,
    gsi2sk: (startTime: string) => `AUCTION#${startTime}`,
  },
  task: {
    pk: (shopkeeperId: string) => `SHOPKEEPER#${shopkeeperId}`,
    sk: (assignedDate: string, taskId: string) => `TASK#${assignedDate}#${taskId}`,
    gsi1pk: (taskId: string) => `TASK#${taskId}`,
    gsi1sk: () => 'METADATA',
    gsi2pk: (status: string) => `STATUS#${status}`,
    gsi2sk: (assignedDate: string) => `TASK#${assignedDate}`,
  },
  transaction: {
    pk: (shopkeeperId: string) => `SHOPKEEPER#${shopkeeperId}`,
    sk: (timestamp: string, transactionId: string) =>
      `TRANSACTION#${timestamp}#${transactionId}`,
    gsi1pk: (transactionId: string) => `TRANSACTION#${transactionId}`,
    gsi1sk: () => 'METADATA',
  },
};
