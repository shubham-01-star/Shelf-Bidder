/**
 * PostgreSQL Operations Index
 * Task 2.2: Export all database operations
 */

export { ShopkeeperOperations } from './shopkeeper';
export { CampaignOperations } from './campaign';
export { TaskOperations } from './task';
export { ShelfSpaceOperations } from './shelf-space';
export { WalletTransactionOperations } from './wallet-transaction';

// Re-export types for convenience
export type {
  Shopkeeper,
  Campaign,
  Task,
  ShelfSpace,
  WalletTransaction,
  CreateShopkeeperInput,
  UpdateShopkeeperInput,
  CreateCampaignInput,
  CreateTaskInput,
  CreateTransactionInput,
  QueryOptions,
  PaginatedResult,
} from '../types';
