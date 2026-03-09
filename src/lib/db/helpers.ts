/**
 * Database Helper Functions Module
 * 
 * Provides utility functions for common database operations with built-in validation.
 * All operations include pre-validation to prevent DynamoDB errors.
 */

import {
  GetCommand,
  PutCommand,
  QueryCommand,
  BatchWriteCommand,
  type BatchWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDBClient } from './client';
import { handleDynamoDBError, ValidationError } from './errors';
import { withRetry } from './retry';
import { validateKey, type ValidationResult } from './validation';

// ============================================================================
// Types
// ============================================================================

export interface QueryParams {
  tableName: string;
  keyCondition: string;
  expressionValues: Record<string, any>;
  indexName?: string;
  limit?: number;
  startKey?: Record<string, any>;
  scanIndexForward?: boolean;
}

export interface KeyParams {
  tableName: string;
  pk: string;
  sk: string;
}

export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
  count: number;
}

export interface BatchResult {
  successful: number;
  failed: number;
  errors: Array<{ item: any; error: string }>;
}

export type KeyType = 
  | 'shopkeeper'
  | 'task'
  | 'auction'
  | 'transaction'
  | 'shelfspace';

// ============================================================================
// Safe Query Operation
// ============================================================================

/**
 * Safely execute a DynamoDB query with validation
 * 
 * @param params Query parameters including table name, key condition, and expression values
 * @returns Query result with items, count, and pagination key
 * @throws ValidationError if parameters are invalid
 * @throws DatabaseError if query fails
 * 
 * @example
 * ```typescript
 * const result = await safeQuery<Task>({
 *   tableName: TABLE_NAMES.TASKS,
 *   keyCondition: 'PK = :pk AND begins_with(SK, :prefix)',
 *   expressionValues: {
 *     ':pk': 'SHOPKEEPER#123',
 *     ':prefix': 'TASK#'
 *   },
 *   limit: 10
 * });
 * ```
 */
export async function safeQuery<T>(params: QueryParams): Promise<QueryResult<T>> {
  return withRetry(async () => {
    try {
      // Validate required parameters
      if (!params.tableName) {
        throw new ValidationError('Table name is required for query operation');
      }
      if (!params.keyCondition) {
        throw new ValidationError('Key condition is required for query operation');
      }
      if (!params.expressionValues || Object.keys(params.expressionValues).length === 0) {
        throw new ValidationError('Expression values are required for query operation');
      }

      // Execute query
      const result = await dynamoDBClient.send(
        new QueryCommand({
          TableName: params.tableName,
          KeyConditionExpression: params.keyCondition,
          ExpressionAttributeValues: params.expressionValues,
          IndexName: params.indexName,
          Limit: params.limit,
          ExclusiveStartKey: params.startKey,
          ScanIndexForward: params.scanIndexForward,
        })
      );

      return {
        items: (result.Items || []) as T[],
        lastEvaluatedKey: result.LastEvaluatedKey,
        count: result.Count || 0,
      };
    } catch (error) {
      throw handleDynamoDBError(error, 'executing safe query');
    }
  });
}

// ============================================================================
// Safe Get Operation
// ============================================================================

/**
 * Safely get a single item from DynamoDB with key validation
 * 
 * @param key Key parameters including table name, partition key, and sort key
 * @returns The item if found, null otherwise
 * @throws ValidationError if key parameters are invalid
 * @throws DatabaseError if get operation fails
 * 
 * @example
 * ```typescript
 * const shopkeeper = await safeGet<Shopkeeper>({
 *   tableName: TABLE_NAMES.SHOPKEEPERS,
 *   pk: 'SHOPKEEPER#123',
 *   sk: 'METADATA'
 * });
 * ```
 */
export async function safeGet<T>(key: KeyParams): Promise<T | null> {
  return withRetry(async () => {
    try {
      // Validate table name
      if (!key.tableName) {
        throw new ValidationError('Table name is required for get operation');
      }

      // Validate keys
      const validationResult = validateKey(key.pk, key.sk);
      if (!validationResult.valid) {
        throw new ValidationError(
          `Invalid key structure: ${validationResult.errors.join('; ')}`
        );
      }

      // Execute get
      const result = await dynamoDBClient.send(
        new GetCommand({
          TableName: key.tableName,
          Key: {
            PK: key.pk,
            SK: key.sk,
          },
        })
      );

      return (result.Item as T) || null;
    } catch (error) {
      throw handleDynamoDBError(error, 'executing safe get');
    }
  });
}

// ============================================================================
// Safe Put Operation
// ============================================================================

/**
 * Safely put an item into DynamoDB with validation
 * 
 * @param tableName The name of the table
 * @param item The item to put
 * @param validator Optional validation function to run before putting
 * @throws ValidationError if validation fails
 * @throws DatabaseError if put operation fails
 * 
 * @example
 * ```typescript
 * await safePut(
 *   TABLE_NAMES.SHOPKEEPERS,
 *   shopkeeperItem,
 *   (item) => {
 *     if (!item.PK || !item.SK) {
 *       return { valid: false, errors: ['Missing required keys'], warnings: [] };
 *     }
 *     return { valid: true, errors: [], warnings: [] };
 *   }
 * );
 * ```
 */
export async function safePut<T extends Record<string, any>>(
  tableName: string,
  item: T,
  validator?: (item: T) => ValidationResult
): Promise<void> {
  return withRetry(async () => {
    try {
      // Validate table name
      if (!tableName) {
        throw new ValidationError('Table name is required for put operation');
      }

      // Validate item
      if (!item || typeof item !== 'object') {
        throw new ValidationError('Item must be a valid object');
      }

      // Run custom validator if provided
      if (validator) {
        const validationResult = validator(item);
        if (!validationResult.valid) {
          throw new ValidationError(
            `Item validation failed: ${validationResult.errors.join('; ')}`
          );
        }
      }

      // Validate keys exist
      if (!item.PK || !item.SK) {
        throw new ValidationError('Item must have PK and SK properties');
      }

      const keyValidation = validateKey(item.PK, item.SK);
      if (!keyValidation.valid) {
        throw new ValidationError(
          `Invalid key structure: ${keyValidation.errors.join('; ')}`
        );
      }

      // Execute put
      await dynamoDBClient.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );
    } catch (error) {
      throw handleDynamoDBError(error, 'executing safe put');
    }
  });
}

// ============================================================================
// Safe Batch Write Operation
// ============================================================================

/**
 * Safely execute a batch write operation with validation
 * 
 * DynamoDB batch write has a limit of 25 items per request.
 * This function automatically chunks larger batches.
 * 
 * @param tableName The name of the table
 * @param items Array of items to write (put or delete)
 * @returns Batch result with success/failure counts
 * @throws ValidationError if parameters are invalid
 * @throws DatabaseError if batch write fails
 * 
 * @example
 * ```typescript
 * const result = await safeBatchWrite(TABLE_NAMES.TASKS, [
 *   { PutRequest: { Item: task1 } },
 *   { PutRequest: { Item: task2 } },
 *   { DeleteRequest: { Key: { PK: 'TASK#123', SK: 'METADATA' } } }
 * ]);
 * ```
 */
export async function safeBatchWrite(
  tableName: string,
  items: any[]
): Promise<BatchResult> {
  return withRetry(async () => {
    try {
      // Validate table name
      if (!tableName) {
        throw new ValidationError('Table name is required for batch write operation');
      }

      // Validate items array
      if (!Array.isArray(items) || items.length === 0) {
        throw new ValidationError('Items must be a non-empty array');
      }

      const result: BatchResult = {
        successful: 0,
        failed: 0,
        errors: [],
      };

      // DynamoDB batch write limit is 25 items
      const BATCH_SIZE = 25;
      const chunks: any[][] = [];

      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        chunks.push(items.slice(i, i + BATCH_SIZE));
      }

      // Process each chunk
      for (const chunk of chunks) {
        try {
          const requestItems: BatchWriteCommandInput['RequestItems'] = {
            [tableName]: chunk,
          };

          const response = await dynamoDBClient.send(
            new BatchWriteCommand({
              RequestItems: requestItems,
            })
          );

          // Count successful writes
          const successfulInChunk = chunk.length - (response.UnprocessedItems?.[tableName]?.length || 0);
          result.successful += successfulInChunk;

          // Handle unprocessed items
          if (response.UnprocessedItems && response.UnprocessedItems[tableName]) {
            const unprocessedCount = response.UnprocessedItems[tableName].length;
            result.failed += unprocessedCount;
            
            response.UnprocessedItems[tableName].forEach((item) => {
              result.errors.push({
                item,
                error: 'Item was not processed (throttling or capacity exceeded)',
              });
            });
          }
        } catch (error) {
          // If a chunk fails, mark all items in that chunk as failed
          result.failed += chunk.length;
          chunk.forEach((item) => {
            result.errors.push({
              item,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
        }
      }

      return result;
    } catch (error) {
      throw handleDynamoDBError(error, 'executing safe batch write');
    }
  });
}

// ============================================================================
// Key Validation and Building Helpers
// ============================================================================

/**
 * Validate and build a DynamoDB key based on entity type
 * 
 * @param keyType The type of entity key to build
 * @param params Variable parameters based on key type
 * @returns The constructed key string
 * @throws ValidationError if parameters are invalid for the key type
 * 
 * @example
 * ```typescript
 * // Shopkeeper key
 * const pk = validateAndBuildKey('shopkeeper', shopkeeperId);
 * 
 * // Task key
 * const sk = validateAndBuildKey('task', assignedDate, taskId);
 * 
 * // Transaction key
 * const sk = validateAndBuildKey('transaction', timestamp, transactionId);
 * ```
 */
export function validateAndBuildKey(keyType: KeyType, ...params: string[]): string {
  switch (keyType) {
    case 'shopkeeper': {
      const [shopkeeperId] = params;
      if (!shopkeeperId) {
        throw new ValidationError('Shopkeeper ID is required');
      }
      return `SHOPKEEPER#${shopkeeperId}`;
    }

    case 'task': {
      const [assignedDate, taskId] = params;
      if (!assignedDate) {
        throw new ValidationError('Assigned date is required for task key');
      }
      if (!taskId) {
        throw new ValidationError('Task ID is required for task key');
      }
      return `TASK#${assignedDate}#${taskId}`;
    }

    case 'auction': {
      const [auctionId] = params;
      if (!auctionId) {
        throw new ValidationError('Auction ID is required');
      }
      return `AUCTION#${auctionId}`;
    }

    case 'transaction': {
      const [timestamp, transactionId] = params;
      if (!timestamp) {
        throw new ValidationError('Timestamp is required for transaction key');
      }
      if (!transactionId) {
        throw new ValidationError('Transaction ID is required for transaction key');
      }
      return `TRANSACTION#${timestamp}#${transactionId}`;
    }

    case 'shelfspace': {
      const [analysisDate, shelfSpaceId] = params;
      if (!analysisDate) {
        throw new ValidationError('Analysis date is required for shelf space key');
      }
      if (!shelfSpaceId) {
        throw new ValidationError('Shelf space ID is required for shelf space key');
      }
      return `SHELFSPACE#${analysisDate}#${shelfSpaceId}`;
    }

    default:
      throw new ValidationError(`Unknown key type: ${keyType}`);
  }
}
