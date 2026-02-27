/**
 * Database layer exports
 * Provides centralized access to DynamoDB types, mappers, and utilities
 */

// Export types
export * from './types';
export * from './mappers';
export * from './errors';

// Export operations
export {
  ShopkeeperOperations,
  ShelfSpaceOperations,
  AuctionOperations,
  TaskOperations,
  WalletTransactionOperations,
} from './operations';

// Export client
export { dynamoDBClient } from './client';

// Re-export commonly used items for convenience
export { TABLE_NAMES, KeyBuilder } from './types';
export {
  ShopkeeperMapper,
  ShelfSpaceMapper,
  AuctionMapper,
  TaskMapper,
  WalletTransactionMapper,
} from './mappers';
