/**
 * PostgreSQL Database Layer - Main Export
 * Task 2.2: PostgreSQL operations layer
 */

// Client and connection management
export { query, getClient, transaction, closePool, healthCheck } from './client';

// Operations
export {
  ShopkeeperOperations,
  ShelfSpaceOperations,
  CampaignOperations,
  TaskOperations,
  WalletTransactionOperations,
  TransactionOperations,
} from './operations';

// Mappers
export {
  ShopkeeperMapper,
  ShelfSpaceMapper,
  CampaignMapper,
  TaskMapper,
  WalletTransactionMapper,
} from './mappers';

// Types
export type {
  Shopkeeper,
  ShelfSpace,
  Campaign,
  Task,
  WalletTransaction,
  EmptySpace,
  Product,
  PlacementRequirement,
  Dimensions,
  PlacementInstructions,
  VerificationResult,
  CreateShopkeeperInput,
  UpdateShopkeeperInput,
  CreateCampaignInput,
  CreateTaskInput,
  CreateTransactionInput,
  QueryOptions,
  PaginatedResult,
  ActiveCampaignView,
  ShopkeeperDashboardView,
} from './types';

// Error classes
export {
  DatabaseError,
  NotFoundError,
  DuplicateError,
  InsufficientFundsError,
} from './types';

// Validation schemas
export {
  ShopkeeperSchema,
  CreateShopkeeperSchema,
  UpdateShopkeeperSchema,
  ShelfSpaceSchema,
  CreateShelfSpaceSchema,
  CampaignSchema,
  CreateCampaignSchema,
  TaskSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  WalletTransactionSchema,
  CreateTransactionSchema,
  validate,
  safeValidate,
  validateOrThrow,
} from './validation';

