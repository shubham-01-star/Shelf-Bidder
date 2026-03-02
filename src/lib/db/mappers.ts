/**
 * Entity mappers for converting between application models and DynamoDB items
 * 
 * Enhanced with validation, error handling, and type-safe conversions.
 */

import type {
  Shopkeeper,
  ShelfSpace,
  Auction,
  Task,
  WalletTransaction,
} from '@/types/models';
import type {
  ShopkeeperItem,
  ShelfSpaceItem,
  AuctionItem,
  TaskItem,
  WalletTransactionItem,
} from './types';
import { KeyBuilder } from './types';
import { 
  schemaValidator, 
  type ValidationResult,
  createValidationError 
} from './validation';

// ============================================================================
// Enhanced Mapper Base Interface
// ============================================================================

/**
 * Enhanced mapper interface with validation and error handling
 */
export interface EnhancedMapper<TModel, TItem> {
  toItem(model: TModel): TItem;
  fromItem(item: TItem): TModel;
  validateModel(model: TModel): ValidationResult;
  validateItem(item: TItem): ValidationResult;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely stringify JSON with error handling
 */
function safeStringify(value: any, fieldName: string): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    throw new Error(
      `Failed to stringify ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Safely parse JSON with error handling and default value
 */
function safeParse<T>(value: string | undefined, fieldName: string, defaultValue: T): T {
  if (!value) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate required fields are present
 */
function validateRequired(obj: any, fields: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null) {
      errors.push(`Required field '${field}' is missing`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Shopkeeper Mapper
// ============================================================================

export const ShopkeeperMapper: EnhancedMapper<Shopkeeper, ShopkeeperItem> = {
  validateModel(shopkeeper: Shopkeeper): ValidationResult {
    // Validate required fields
    const fieldValidation = validateRequired(shopkeeper, [
      'id',
      'name',
      'phoneNumber',
      'storeAddress',
      'preferredLanguage',
      'timezone',
      'walletBalance',
      'registrationDate',
      'lastActiveDate',
    ]);
    
    if (!fieldValidation.valid) {
      return fieldValidation;
    }
    
    // Validate key structure
    const keyValidation = schemaValidator.validateShopkeeperKey(shopkeeper.id);
    if (!keyValidation.valid) {
      return keyValidation;
    }
    
    // Validate data types
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (typeof shopkeeper.walletBalance !== 'number') {
      errors.push('walletBalance must be a number');
    }
    
    if (shopkeeper.walletBalance < 0) {
      warnings.push('walletBalance is negative');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  validateItem(item: ShopkeeperItem): ValidationResult {
    // Validate required fields
    const fieldValidation = validateRequired(item, [
      'PK',
      'SK',
      'EntityType',
      'ShopkeeperId',
      'Name',
      'PhoneNumber',
      'StoreAddress',
      'PreferredLanguage',
      'Timezone',
      'WalletBalance',
      'RegistrationDate',
      'LastActiveDate',
    ]);
    
    if (!fieldValidation.valid) {
      return fieldValidation;
    }
    
    // Validate entity type
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (item.EntityType !== 'SHOPKEEPER') {
      errors.push(`Invalid EntityType: expected 'SHOPKEEPER', got '${item.EntityType}'`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  toItem(shopkeeper: Shopkeeper): ShopkeeperItem {
    // Pre-validation
    const validation = this.validateModel(shopkeeper);
    if (!validation.valid) {
      throw createValidationError(validation);
    }
    
    const now = new Date().toISOString();
    return {
      PK: KeyBuilder.shopkeeper.pk(shopkeeper.id),
      SK: KeyBuilder.shopkeeper.sk(),
      EntityType: 'SHOPKEEPER',
      ShopkeeperId: shopkeeper.id,
      Name: shopkeeper.name,
      PhoneNumber: shopkeeper.phoneNumber,
      StoreAddress: shopkeeper.storeAddress,
      PreferredLanguage: shopkeeper.preferredLanguage,
      Timezone: shopkeeper.timezone,
      WalletBalance: shopkeeper.walletBalance,
      RegistrationDate: shopkeeper.registrationDate,
      LastActiveDate: shopkeeper.lastActiveDate,
      CreatedAt: now,
      UpdatedAt: now,
    };
  },

  fromItem(item: ShopkeeperItem): Shopkeeper {
    // Pre-validation
    const validation = this.validateItem(item);
    if (!validation.valid) {
      throw createValidationError(validation);
    }
    
    return {
      id: item.ShopkeeperId,
      name: item.Name,
      phoneNumber: item.PhoneNumber,
      storeAddress: item.StoreAddress,
      preferredLanguage: item.PreferredLanguage,
      timezone: item.Timezone,
      walletBalance: item.WalletBalance,
      registrationDate: item.RegistrationDate,
      lastActiveDate: item.LastActiveDate,
    };
  },
};

// ============================================================================
// ShelfSpace Mapper
// ============================================================================

export const ShelfSpaceMapper: EnhancedMapper<ShelfSpace, ShelfSpaceItem> = {
  validateModel(shelfSpace: ShelfSpace): ValidationResult {
    // Validate required fields
    const fieldValidation = validateRequired(shelfSpace, [
      'id',
      'shopkeeperId',
      'photoUrl',
      'analysisDate',
      'emptySpaces',
      'currentInventory',
      'analysisConfidence',
    ]);
    
    if (!fieldValidation.valid) {
      return fieldValidation;
    }
    
    // Validate key structure
    const keyValidation = schemaValidator.validateShelfSpaceKey(
      shelfSpace.shopkeeperId,
      shelfSpace.analysisDate,
      shelfSpace.id
    );
    
    if (!keyValidation.valid) {
      return keyValidation;
    }
    
    // Validate data types
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!Array.isArray(shelfSpace.emptySpaces)) {
      errors.push('emptySpaces must be an array');
    }
    
    if (!Array.isArray(shelfSpace.currentInventory)) {
      errors.push('currentInventory must be an array');
    }
    
    if (typeof shelfSpace.analysisConfidence !== 'number') {
      errors.push('analysisConfidence must be a number');
    }
    
    if (shelfSpace.analysisConfidence < 0 || shelfSpace.analysisConfidence > 1) {
      warnings.push('analysisConfidence should be between 0 and 1');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  validateItem(item: ShelfSpaceItem): ValidationResult {
    // Validate required fields
    const fieldValidation = validateRequired(item, [
      'PK',
      'SK',
      'GSI1PK',
      'GSI1SK',
      'EntityType',
      'ShelfSpaceId',
      'ShopkeeperId',
      'PhotoUrl',
      'AnalysisDate',
      'EmptySpaces',
      'CurrentInventory',
      'AnalysisConfidence',
    ]);
    
    if (!fieldValidation.valid) {
      return fieldValidation;
    }
    
    // Validate entity type
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (item.EntityType !== 'SHELFSPACE') {
      errors.push(`Invalid EntityType: expected 'SHELFSPACE', got '${item.EntityType}'`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  toItem(shelfSpace: ShelfSpace): ShelfSpaceItem {
    // Pre-validation
    const validation = this.validateModel(shelfSpace);
    if (!validation.valid) {
      throw createValidationError(validation);
    }
    
    const now = new Date().toISOString();
    return {
      PK: KeyBuilder.shelfSpace.pk(shelfSpace.shopkeeperId),
      SK: KeyBuilder.shelfSpace.sk(shelfSpace.analysisDate, shelfSpace.id),
      GSI1PK: KeyBuilder.shelfSpace.gsi1pk(shelfSpace.id),
      GSI1SK: KeyBuilder.shelfSpace.gsi1sk(),
      EntityType: 'SHELFSPACE',
      ShelfSpaceId: shelfSpace.id,
      ShopkeeperId: shelfSpace.shopkeeperId,
      PhotoUrl: shelfSpace.photoUrl,
      AnalysisDate: shelfSpace.analysisDate,
      EmptySpaces: safeStringify(shelfSpace.emptySpaces, 'emptySpaces'),
      CurrentInventory: safeStringify(shelfSpace.currentInventory, 'currentInventory'),
      AnalysisConfidence: shelfSpace.analysisConfidence,
      CreatedAt: now,
      UpdatedAt: now,
    };
  },

  fromItem(item: ShelfSpaceItem): ShelfSpace {
    // Pre-validation
    const validation = this.validateItem(item);
    if (!validation.valid) {
      throw createValidationError(validation);
    }
    
    return {
      id: item.ShelfSpaceId,
      shopkeeperId: item.ShopkeeperId,
      photoUrl: item.PhotoUrl,
      analysisDate: item.AnalysisDate,
      emptySpaces: safeParse(item.EmptySpaces, 'emptySpaces', []),
      currentInventory: safeParse(item.CurrentInventory, 'currentInventory', []),
      analysisConfidence: item.AnalysisConfidence,
    };
  },
};

// ============================================================================
// Auction Mapper
// ============================================================================

export const AuctionMapper: EnhancedMapper<Auction, AuctionItem> = {
  validateModel(auction: Auction): ValidationResult {
    // Validate required fields
    const fieldValidation = validateRequired(auction, [
      'id',
      'shelfSpaceId',
      'startTime',
      'endTime',
      'status',
      'bids',
    ]);
    
    if (!fieldValidation.valid) {
      return fieldValidation;
    }
    
    // Validate key structure
    const keyValidation = schemaValidator.validateAuctionKey(auction.id);
    if (!keyValidation.valid) {
      return keyValidation;
    }
    
    // Validate data types
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!Array.isArray(auction.bids)) {
      errors.push('bids must be an array');
    }
    
    const validStatuses = ['active', 'completed', 'cancelled'];
    if (!validStatuses.includes(auction.status)) {
      errors.push(`Invalid status: must be one of ${validStatuses.join(', ')}`);
    }
    
    if (auction.winningBid !== undefined && typeof auction.winningBid !== 'number') {
      errors.push('winningBid must be a number');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  validateItem(item: AuctionItem): ValidationResult {
    // Validate required fields
    const fieldValidation = validateRequired(item, [
      'PK',
      'SK',
      'GSI1PK',
      'GSI1SK',
      'GSI2PK',
      'GSI2SK',
      'EntityType',
      'AuctionId',
      'ShelfSpaceId',
      'StartTime',
      'EndTime',
      'Status',
      'Bids',
    ]);
    
    if (!fieldValidation.valid) {
      return fieldValidation;
    }
    
    // Validate entity type
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (item.EntityType !== 'AUCTION') {
      errors.push(`Invalid EntityType: expected 'AUCTION', got '${item.EntityType}'`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  toItem(auction: Auction): AuctionItem {
    // Pre-validation
    const validation = this.validateModel(auction);
    if (!validation.valid) {
      throw createValidationError(validation);
    }
    
    const now = new Date().toISOString();
    return {
      PK: KeyBuilder.auction.pk(auction.id),
      SK: KeyBuilder.auction.sk(),
      GSI1PK: KeyBuilder.auction.gsi1pk(auction.shelfSpaceId),
      GSI1SK: KeyBuilder.auction.gsi1sk(auction.startTime),
      GSI2PK: KeyBuilder.auction.gsi2pk(auction.status),
      GSI2SK: KeyBuilder.auction.gsi2sk(auction.startTime),
      EntityType: 'AUCTION',
      AuctionId: auction.id,
      ShelfSpaceId: auction.shelfSpaceId,
      StartTime: auction.startTime,
      EndTime: auction.endTime,
      Status: auction.status,
      Bids: safeStringify(auction.bids, 'bids'),
      WinnerId: auction.winnerId,
      WinningBid: auction.winningBid,
      CreatedAt: now,
      UpdatedAt: now,
    };
  },

  fromItem(item: AuctionItem): Auction {
    // Pre-validation
    const validation = this.validateItem(item);
    if (!validation.valid) {
      throw createValidationError(validation);
    }
    
    return {
      id: item.AuctionId,
      shelfSpaceId: item.ShelfSpaceId,
      startTime: item.StartTime,
      endTime: item.EndTime,
      status: item.Status as 'active' | 'completed' | 'cancelled',
      bids: safeParse(item.Bids, 'bids', []),
      winnerId: item.WinnerId,
      winningBid: item.WinningBid,
    };
  },
};

// ============================================================================
// Task Mapper
// ============================================================================

export const TaskMapper: EnhancedMapper<Task, TaskItem> = {
  validateModel(task: Task): ValidationResult {
    // Validate required fields
    const fieldValidation = validateRequired(task, [
      'id',
      'auctionId',
      'shopkeeperId',
      'instructions',
      'status',
      'assignedDate',
      'earnings',
    ]);
    
    if (!fieldValidation.valid) {
      return fieldValidation;
    }
    
    // Validate key structure
    const keyValidation = schemaValidator.validateTaskKey(
      task.shopkeeperId,
      task.assignedDate,
      task.id
    );
    
    if (!keyValidation.valid) {
      return keyValidation;
    }
    
    // Validate data types
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const validStatuses = ['assigned', 'in_progress', 'completed', 'failed'];
    if (!validStatuses.includes(task.status)) {
      errors.push(`Invalid status: must be one of ${validStatuses.join(', ')}`);
    }
    
    if (typeof task.earnings !== 'number') {
      errors.push('earnings must be a number');
    }
    
    if (task.earnings < 0) {
      warnings.push('earnings is negative');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  validateItem(item: TaskItem): ValidationResult {
    // Validate required fields
    const fieldValidation = validateRequired(item, [
      'PK',
      'SK',
      'GSI1PK',
      'GSI1SK',
      'GSI2PK',
      'GSI2SK',
      'EntityType',
      'TaskId',
      'AuctionId',
      'ShopkeeperId',
      'Instructions',
      'Status',
      'AssignedDate',
      'Earnings',
    ]);
    
    if (!fieldValidation.valid) {
      return fieldValidation;
    }
    
    // Validate entity type
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (item.EntityType !== 'TASK') {
      errors.push(`Invalid EntityType: expected 'TASK', got '${item.EntityType}'`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  toItem(task: Task): TaskItem {
    // Pre-validation
    const validation = this.validateModel(task);
    if (!validation.valid) {
      throw createValidationError(validation);
    }
    
    const now = new Date().toISOString();
    return {
      PK: KeyBuilder.task.pk(task.shopkeeperId),
      SK: KeyBuilder.task.sk(task.assignedDate, task.id),
      GSI1PK: KeyBuilder.task.gsi1pk(task.id),
      GSI1SK: KeyBuilder.task.gsi1sk(),
      GSI2PK: KeyBuilder.task.gsi2pk(task.status),
      GSI2SK: KeyBuilder.task.gsi2sk(task.assignedDate),
      EntityType: 'TASK',
      TaskId: task.id,
      AuctionId: task.auctionId,
      ShopkeeperId: task.shopkeeperId,
      Instructions: safeStringify(task.instructions, 'instructions'),
      Status: task.status,
      AssignedDate: task.assignedDate,
      CompletedDate: task.completedDate,
      ProofPhotoUrl: task.proofPhotoUrl,
      Earnings: task.earnings,
      VerificationResult: task.verificationResult
        ? safeStringify(task.verificationResult, 'verificationResult')
        : undefined,
      CreatedAt: now,
      UpdatedAt: now,
    };
  },

  fromItem(item: TaskItem): Task {
    // Pre-validation
    const validation = this.validateItem(item);
    if (!validation.valid) {
      throw createValidationError(validation);
    }
    
    // Default PlacementInstructions structure
    const defaultInstructions: any = {
      productName: '',
      brandName: '',
      targetLocation: {
        id: '',
        coordinates: { x: 0, y: 0, width: 0, height: 0 },
        shelfLevel: 0,
        visibility: 'medium',
        accessibility: 'moderate',
      },
      positioningRules: [],
      visualRequirements: [],
      timeLimit: 0,
    };
    
    return {
      id: item.TaskId,
      auctionId: item.AuctionId,
      shopkeeperId: item.ShopkeeperId,
      instructions: safeParse(item.Instructions, 'instructions', defaultInstructions),
      status: item.Status as 'assigned' | 'in_progress' | 'completed' | 'failed',
      assignedDate: item.AssignedDate,
      completedDate: item.CompletedDate,
      proofPhotoUrl: item.ProofPhotoUrl,
      earnings: item.Earnings,
      verificationResult: item.VerificationResult
        ? safeParse(item.VerificationResult, 'verificationResult', undefined)
        : undefined,
    };
  },
};

// ============================================================================
// WalletTransaction Mapper
// ============================================================================

export const WalletTransactionMapper: EnhancedMapper<WalletTransaction, WalletTransactionItem> = {
  validateModel(transaction: WalletTransaction): ValidationResult {
    // Validate required fields
    const fieldValidation = validateRequired(transaction, [
      'id',
      'shopkeeperId',
      'type',
      'amount',
      'description',
      'timestamp',
      'status',
    ]);
    
    if (!fieldValidation.valid) {
      return fieldValidation;
    }
    
    // Validate key structure
    const keyValidation = schemaValidator.validateTransactionKey(
      transaction.shopkeeperId,
      transaction.timestamp,
      transaction.id
    );
    
    if (!keyValidation.valid) {
      return keyValidation;
    }
    
    // Validate data types
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const validTypes = ['earning', 'payout', 'adjustment'];
    if (!validTypes.includes(transaction.type)) {
      errors.push(`Invalid type: must be one of ${validTypes.join(', ')}`);
    }
    
    const validStatuses = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(transaction.status)) {
      errors.push(`Invalid status: must be one of ${validStatuses.join(', ')}`);
    }
    
    if (typeof transaction.amount !== 'number') {
      errors.push('amount must be a number');
    }
    
    if (transaction.amount < 0) {
      warnings.push('amount is negative');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  validateItem(item: WalletTransactionItem): ValidationResult {
    // Validate required fields
    const fieldValidation = validateRequired(item, [
      'PK',
      'SK',
      'GSI1PK',
      'GSI1SK',
      'EntityType',
      'TransactionId',
      'ShopkeeperId',
      'Type',
      'Amount',
      'Description',
      'Timestamp',
      'Status',
    ]);
    
    if (!fieldValidation.valid) {
      return fieldValidation;
    }
    
    // Validate entity type
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (item.EntityType !== 'TRANSACTION') {
      errors.push(`Invalid EntityType: expected 'TRANSACTION', got '${item.EntityType}'`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  toItem(transaction: WalletTransaction): WalletTransactionItem {
    // Pre-validation
    const validation = this.validateModel(transaction);
    if (!validation.valid) {
      throw createValidationError(validation);
    }
    
    const now = new Date().toISOString();
    return {
      PK: KeyBuilder.transaction.pk(transaction.shopkeeperId),
      SK: KeyBuilder.transaction.sk(transaction.timestamp, transaction.id),
      GSI1PK: KeyBuilder.transaction.gsi1pk(transaction.id),
      GSI1SK: KeyBuilder.transaction.gsi1sk(),
      EntityType: 'TRANSACTION',
      TransactionId: transaction.id,
      ShopkeeperId: transaction.shopkeeperId,
      Type: transaction.type,
      Amount: transaction.amount,
      Description: transaction.description,
      TaskId: transaction.taskId,
      Timestamp: transaction.timestamp,
      Status: transaction.status,
      CreatedAt: now,
      UpdatedAt: now,
    };
  },

  fromItem(item: WalletTransactionItem): WalletTransaction {
    // Pre-validation
    const validation = this.validateItem(item);
    if (!validation.valid) {
      throw createValidationError(validation);
    }
    
    return {
      id: item.TransactionId,
      shopkeeperId: item.ShopkeeperId,
      type: item.Type as 'earning' | 'payout' | 'adjustment',
      amount: item.Amount,
      description: item.Description,
      taskId: item.TaskId,
      timestamp: item.Timestamp,
      status: item.Status as 'pending' | 'completed' | 'failed',
    };
  },
};
