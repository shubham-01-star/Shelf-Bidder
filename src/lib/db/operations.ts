/**
 * DynamoDB CRUD operations for all entities
 * Implements access patterns with error handling and retry logic
 */

import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchGetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  Shopkeeper,
  ShelfSpace,
  Auction,
  Task,
  WalletTransaction,
} from '@/types/models';
import {
  ShopkeeperMapper,
  ShelfSpaceMapper,
  AuctionMapper,
  TaskMapper,
  WalletTransactionMapper,
} from './mappers';
import type {
  ShopkeeperItem,
  ShelfSpaceItem,
  AuctionItem,
  TaskItem,
  WalletTransactionItem,
  QueryOptions,
  QueryResult,
} from './types';
import { TABLE_NAMES } from './types';
import { dynamoDBClient } from './client';
import { handleDynamoDBError, ItemNotFoundError } from './errors';
import { withRetry } from './retry';

// ============================================================================
// Shopkeeper Operations
// ============================================================================

export const ShopkeeperOperations = {
  /**
   * Create a new shopkeeper
   */
  async create(shopkeeper: Shopkeeper): Promise<Shopkeeper> {
    return withRetry(async () => {
      try {
        const item = ShopkeeperMapper.toItem(shopkeeper);
        
        await dynamoDBClient.send(
          new PutCommand({
            TableName: TABLE_NAMES.SHOPKEEPERS,
            Item: item,
            ConditionExpression: 'attribute_not_exists(PK)',
          })
        );
        
        return shopkeeper;
      } catch (error) {
        throw handleDynamoDBError(error, 'creating shopkeeper');
      }
    });
  },

  /**
   * Get shopkeeper by ID
   */
  async get(shopkeeperId: string): Promise<Shopkeeper> {
    return withRetry(async () => {
      try {
        const result = await dynamoDBClient.send(
          new GetCommand({
            TableName: TABLE_NAMES.SHOPKEEPERS,
            Key: {
              PK: `SHOPKEEPER#${shopkeeperId}`,
              SK: 'METADATA',
            },
          })
        );

        if (!result.Item) {
          throw new ItemNotFoundError('Shopkeeper', shopkeeperId);
        }

        return ShopkeeperMapper.fromItem(result.Item as ShopkeeperItem);
      } catch (error) {
        throw handleDynamoDBError(error, 'getting shopkeeper');
      }
    });
  },

  /**
   * Update shopkeeper
   */
  async update(
    shopkeeperId: string,
    updates: Partial<Omit<Shopkeeper, 'id'>>
  ): Promise<Shopkeeper> {
    return withRetry(async () => {
      try {
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        // Build update expression dynamically
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            const attrName = `#${key}`;
            const attrValue = `:${key}`;
            
            updateExpressions.push(`${attrName} = ${attrValue}`);
            
            // Map field names to DynamoDB attribute names
            const dbFieldMap: Record<string, string> = {
              name: 'Name',
              phoneNumber: 'PhoneNumber',
              storeAddress: 'StoreAddress',
              preferredLanguage: 'PreferredLanguage',
              timezone: 'Timezone',
              walletBalance: 'WalletBalance',
              lastActiveDate: 'LastActiveDate',
            };
            
            expressionAttributeNames[attrName] = dbFieldMap[key] || key;
            expressionAttributeValues[attrValue] = value;
          }
        });

        // Always update UpdatedAt
        updateExpressions.push('#UpdatedAt = :UpdatedAt');
        expressionAttributeNames['#UpdatedAt'] = 'UpdatedAt';
        expressionAttributeValues[':UpdatedAt'] = new Date().toISOString();

        const result = await dynamoDBClient.send(
          new UpdateCommand({
            TableName: TABLE_NAMES.SHOPKEEPERS,
            Key: {
              PK: `SHOPKEEPER#${shopkeeperId}`,
              SK: 'METADATA',
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(PK)',
            ReturnValues: 'ALL_NEW',
          })
        );

        return ShopkeeperMapper.fromItem(result.Attributes as ShopkeeperItem);
      } catch (error) {
        throw handleDynamoDBError(error, 'updating shopkeeper');
      }
    });
  },

  /**
   * Delete shopkeeper
   */
  async delete(shopkeeperId: string): Promise<void> {
    return withRetry(async () => {
      try {
        await dynamoDBClient.send(
          new DeleteCommand({
            TableName: TABLE_NAMES.SHOPKEEPERS,
            Key: {
              PK: `SHOPKEEPER#${shopkeeperId}`,
              SK: 'METADATA',
            },
            ConditionExpression: 'attribute_exists(PK)',
          })
        );
      } catch (error) {
        throw handleDynamoDBError(error, 'deleting shopkeeper');
      }
    });
  },
};

// ============================================================================
// ShelfSpace Operations
// ============================================================================

export const ShelfSpaceOperations = {
  /**
   * Create a new shelf space analysis
   */
  async create(shelfSpace: ShelfSpace): Promise<ShelfSpace> {
    return withRetry(async () => {
      try {
        const item = ShelfSpaceMapper.toItem(shelfSpace);
        
        await dynamoDBClient.send(
          new PutCommand({
            TableName: TABLE_NAMES.SHELF_SPACES,
            Item: item,
          })
        );
        
        return shelfSpace;
      } catch (error) {
        throw handleDynamoDBError(error, 'creating shelf space');
      }
    });
  },

  /**
   * Get shelf space by ID
   */
  async get(shelfSpaceId: string): Promise<ShelfSpace> {
    return withRetry(async () => {
      try {
        const result = await dynamoDBClient.send(
          new QueryCommand({
            TableName: TABLE_NAMES.SHELF_SPACES,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
            ExpressionAttributeValues: {
              ':gsi1pk': `SHELFSPACE#${shelfSpaceId}`,
              ':gsi1sk': 'METADATA',
            },
            Limit: 1,
          })
        );

        if (!result.Items || result.Items.length === 0) {
          throw new ItemNotFoundError('ShelfSpace', shelfSpaceId);
        }

        return ShelfSpaceMapper.fromItem(result.Items[0] as ShelfSpaceItem);
      } catch (error) {
        throw handleDynamoDBError(error, 'getting shelf space');
      }
    });
  },

  /**
   * Query shelf spaces by shopkeeper with date range
   */
  async queryByShopkeeper(
    shopkeeperId: string,
    startDate?: string,
    endDate?: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<ShelfSpace>> {
    return withRetry(async () => {
      try {
        let keyConditionExpression = 'PK = :pk';
        const expressionAttributeValues: Record<string, any> = {
          ':pk': `SHOPKEEPER#${shopkeeperId}`,
        };

        // Add date range filtering if provided
        if (startDate && endDate) {
          keyConditionExpression += ' AND SK BETWEEN :startDate AND :endDate';
          expressionAttributeValues[':startDate'] = `SHELFSPACE#${startDate}`;
          expressionAttributeValues[':endDate'] = `SHELFSPACE#${endDate}#~`;
        } else if (startDate) {
          keyConditionExpression += ' AND SK >= :startDate';
          expressionAttributeValues[':startDate'] = `SHELFSPACE#${startDate}`;
        } else if (endDate) {
          keyConditionExpression += ' AND SK <= :endDate';
          expressionAttributeValues[':endDate'] = `SHELFSPACE#${endDate}#~`;
        } else {
          keyConditionExpression += ' AND begins_with(SK, :prefix)';
          expressionAttributeValues[':prefix'] = 'SHELFSPACE#';
        }

        const result = await dynamoDBClient.send(
          new QueryCommand({
            TableName: TABLE_NAMES.SHELF_SPACES,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            Limit: options.limit,
            ExclusiveStartKey: options.startKey,
            ScanIndexForward: options.scanIndexForward ?? false, // Default to descending
          })
        );

        const items = (result.Items || []).map((item) =>
          ShelfSpaceMapper.fromItem(item as ShelfSpaceItem)
        );

        return {
          items,
          lastEvaluatedKey: result.LastEvaluatedKey,
          count: result.Count || 0,
        };
      } catch (error) {
        throw handleDynamoDBError(error, 'querying shelf spaces');
      }
    });
  },

  /**
   * Delete shelf space
   */
  async delete(shopkeeperId: string, analysisDate: string, shelfSpaceId: string): Promise<void> {
    return withRetry(async () => {
      try {
        await dynamoDBClient.send(
          new DeleteCommand({
            TableName: TABLE_NAMES.SHELF_SPACES,
            Key: {
              PK: `SHOPKEEPER#${shopkeeperId}`,
              SK: `SHELFSPACE#${analysisDate}#${shelfSpaceId}`,
            },
          })
        );
      } catch (error) {
        throw handleDynamoDBError(error, 'deleting shelf space');
      }
    });
  },
};

// ============================================================================
// Auction Operations
// ============================================================================

export const AuctionOperations = {
  /**
   * Create a new auction
   */
  async create(auction: Auction): Promise<Auction> {
    return withRetry(async () => {
      try {
        const item = AuctionMapper.toItem(auction);
        
        await dynamoDBClient.send(
          new PutCommand({
            TableName: TABLE_NAMES.AUCTIONS,
            Item: item,
            ConditionExpression: 'attribute_not_exists(PK)',
          })
        );
        
        return auction;
      } catch (error) {
        throw handleDynamoDBError(error, 'creating auction');
      }
    });
  },

  /**
   * Get auction by ID
   */
  async get(auctionId: string): Promise<Auction> {
    return withRetry(async () => {
      try {
        const result = await dynamoDBClient.send(
          new GetCommand({
            TableName: TABLE_NAMES.AUCTIONS,
            Key: {
              PK: `AUCTION#${auctionId}`,
              SK: 'METADATA',
            },
          })
        );

        if (!result.Item) {
          throw new ItemNotFoundError('Auction', auctionId);
        }

        return AuctionMapper.fromItem(result.Item as AuctionItem);
      } catch (error) {
        throw handleDynamoDBError(error, 'getting auction');
      }
    });
  },

  /**
   * Update auction (typically for adding bids or updating status)
   */
  async update(
    auctionId: string,
    updates: Partial<Omit<Auction, 'id'>>
  ): Promise<Auction> {
    return withRetry(async () => {
      try {
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        // Build update expression dynamically
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            const attrName = `#${key}`;
            const attrValue = `:${key}`;
            
            updateExpressions.push(`${attrName} = ${attrValue}`);
            
            // Map field names to DynamoDB attribute names
            const dbFieldMap: Record<string, string> = {
              status: 'Status',
              bids: 'Bids',
              winnerId: 'WinnerId',
              winningBid: 'WinningBid',
              endTime: 'EndTime',
            };
            
            expressionAttributeNames[attrName] = dbFieldMap[key] || key;
            
            // Stringify bids array
            if (key === 'bids') {
              expressionAttributeValues[attrValue] = JSON.stringify(value);
            } else {
              expressionAttributeValues[attrValue] = value;
            }
          }
        });

        // Update GSI2PK if status changed
        if (updates.status) {
          updateExpressions.push('#GSI2PK = :gsi2pk');
          expressionAttributeNames['#GSI2PK'] = 'GSI2PK';
          expressionAttributeValues[':gsi2pk'] = `STATUS#${updates.status}`;
        }

        // Always update UpdatedAt
        updateExpressions.push('#UpdatedAt = :UpdatedAt');
        expressionAttributeNames['#UpdatedAt'] = 'UpdatedAt';
        expressionAttributeValues[':UpdatedAt'] = new Date().toISOString();

        const result = await dynamoDBClient.send(
          new UpdateCommand({
            TableName: TABLE_NAMES.AUCTIONS,
            Key: {
              PK: `AUCTION#${auctionId}`,
              SK: 'METADATA',
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(PK)',
            ReturnValues: 'ALL_NEW',
          })
        );

        return AuctionMapper.fromItem(result.Attributes as AuctionItem);
      } catch (error) {
        throw handleDynamoDBError(error, 'updating auction');
      }
    });
  },

  /**
   * Query auctions by shelf space
   */
  async queryByShelfSpace(
    shelfSpaceId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<Auction>> {
    return withRetry(async () => {
      try {
        const result = await dynamoDBClient.send(
          new QueryCommand({
            TableName: TABLE_NAMES.AUCTIONS,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :gsi1pk',
            ExpressionAttributeValues: {
              ':gsi1pk': `SHELFSPACE#${shelfSpaceId}`,
            },
            Limit: options.limit,
            ExclusiveStartKey: options.startKey,
            ScanIndexForward: options.scanIndexForward ?? false,
          })
        );

        const items = (result.Items || []).map((item) =>
          AuctionMapper.fromItem(item as AuctionItem)
        );

        return {
          items,
          lastEvaluatedKey: result.LastEvaluatedKey,
          count: result.Count || 0,
        };
      } catch (error) {
        throw handleDynamoDBError(error, 'querying auctions by shelf space');
      }
    });
  },

  /**
   * Query auctions by status (e.g., active auctions)
   */
  async queryByStatus(
    status: 'active' | 'completed' | 'cancelled',
    options: QueryOptions = {}
  ): Promise<QueryResult<Auction>> {
    return withRetry(async () => {
      try {
        const result = await dynamoDBClient.send(
          new QueryCommand({
            TableName: TABLE_NAMES.AUCTIONS,
            IndexName: 'GSI2',
            KeyConditionExpression: 'GSI2PK = :gsi2pk',
            ExpressionAttributeValues: {
              ':gsi2pk': `STATUS#${status}`,
            },
            Limit: options.limit,
            ExclusiveStartKey: options.startKey,
            ScanIndexForward: options.scanIndexForward ?? false,
          })
        );

        const items = (result.Items || []).map((item) =>
          AuctionMapper.fromItem(item as AuctionItem)
        );

        return {
          items,
          lastEvaluatedKey: result.LastEvaluatedKey,
          count: result.Count || 0,
        };
      } catch (error) {
        throw handleDynamoDBError(error, 'querying auctions by status');
      }
    });
  },

  /**
   * Delete auction
   */
  async delete(auctionId: string): Promise<void> {
    return withRetry(async () => {
      try {
        await dynamoDBClient.send(
          new DeleteCommand({
            TableName: TABLE_NAMES.AUCTIONS,
            Key: {
              PK: `AUCTION#${auctionId}`,
              SK: 'METADATA',
            },
          })
        );
      } catch (error) {
        throw handleDynamoDBError(error, 'deleting auction');
      }
    });
  },
};

// ============================================================================
// Task Operations
// ============================================================================

export const TaskOperations = {
  /**
   * Create a new task
   */
  async create(task: Task): Promise<Task> {
    return withRetry(async () => {
      try {
        const item = TaskMapper.toItem(task);
        
        await dynamoDBClient.send(
          new PutCommand({
            TableName: TABLE_NAMES.TASKS,
            Item: item,
          })
        );
        
        return task;
      } catch (error) {
        throw handleDynamoDBError(error, 'creating task');
      }
    });
  },

  /**
   * Get task by ID
   */
  async get(taskId: string): Promise<Task> {
    return withRetry(async () => {
      try {
        const result = await dynamoDBClient.send(
          new QueryCommand({
            TableName: TABLE_NAMES.TASKS,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
            ExpressionAttributeValues: {
              ':gsi1pk': `TASK#${taskId}`,
              ':gsi1sk': 'METADATA',
            },
            Limit: 1,
          })
        );

        if (!result.Items || result.Items.length === 0) {
          throw new ItemNotFoundError('Task', taskId);
        }

        return TaskMapper.fromItem(result.Items[0] as TaskItem);
      } catch (error) {
        throw handleDynamoDBError(error, 'getting task');
      }
    });
  },

  /**
   * Update task
   */
  async update(
    taskId: string,
    shopkeeperId: string,
    assignedDate: string,
    updates: Partial<Omit<Task, 'id' | 'shopkeeperId' | 'assignedDate'>>
  ): Promise<Task> {
    return withRetry(async () => {
      try {
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        // Build update expression dynamically
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            const attrName = `#${key}`;
            const attrValue = `:${key}`;
            
            updateExpressions.push(`${attrName} = ${attrValue}`);
            
            // Map field names to DynamoDB attribute names
            const dbFieldMap: Record<string, string> = {
              status: 'Status',
              completedDate: 'CompletedDate',
              proofPhotoUrl: 'ProofPhotoUrl',
              earnings: 'Earnings',
              verificationResult: 'VerificationResult',
            };
            
            expressionAttributeNames[attrName] = dbFieldMap[key] || key;
            
            // Stringify complex objects
            if (key === 'verificationResult' && value) {
              expressionAttributeValues[attrValue] = JSON.stringify(value);
            } else {
              expressionAttributeValues[attrValue] = value;
            }
          }
        });

        // Update GSI2PK if status changed
        if (updates.status) {
          updateExpressions.push('#GSI2PK = :gsi2pk');
          expressionAttributeNames['#GSI2PK'] = 'GSI2PK';
          expressionAttributeValues[':gsi2pk'] = `STATUS#${updates.status}`;
        }

        // Always update UpdatedAt
        updateExpressions.push('#UpdatedAt = :UpdatedAt');
        expressionAttributeNames['#UpdatedAt'] = 'UpdatedAt';
        expressionAttributeValues[':UpdatedAt'] = new Date().toISOString();

        const result = await dynamoDBClient.send(
          new UpdateCommand({
            TableName: TABLE_NAMES.TASKS,
            Key: {
              PK: `SHOPKEEPER#${shopkeeperId}`,
              SK: `TASK#${assignedDate}#${taskId}`,
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(PK)',
            ReturnValues: 'ALL_NEW',
          })
        );

        return TaskMapper.fromItem(result.Attributes as TaskItem);
      } catch (error) {
        throw handleDynamoDBError(error, 'updating task');
      }
    });
  },

  /**
   * Query tasks by shopkeeper with date range
   */
  async queryByShopkeeper(
    shopkeeperId: string,
    startDate?: string,
    endDate?: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<Task>> {
    return withRetry(async () => {
      try {
        let keyConditionExpression = 'PK = :pk';
        const expressionAttributeValues: Record<string, any> = {
          ':pk': `SHOPKEEPER#${shopkeeperId}`,
        };

        // Add date range filtering if provided
        if (startDate && endDate) {
          keyConditionExpression += ' AND SK BETWEEN :startDate AND :endDate';
          expressionAttributeValues[':startDate'] = `TASK#${startDate}`;
          expressionAttributeValues[':endDate'] = `TASK#${endDate}#~`;
        } else if (startDate) {
          keyConditionExpression += ' AND SK >= :startDate';
          expressionAttributeValues[':startDate'] = `TASK#${startDate}`;
        } else if (endDate) {
          keyConditionExpression += ' AND SK <= :endDate';
          expressionAttributeValues[':endDate'] = `TASK#${endDate}#~`;
        } else {
          keyConditionExpression += ' AND begins_with(SK, :prefix)';
          expressionAttributeValues[':prefix'] = 'TASK#';
        }

        const result = await dynamoDBClient.send(
          new QueryCommand({
            TableName: TABLE_NAMES.TASKS,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            Limit: options.limit,
            ExclusiveStartKey: options.startKey,
            ScanIndexForward: options.scanIndexForward ?? false,
          })
        );

        const items = (result.Items || []).map((item) =>
          TaskMapper.fromItem(item as TaskItem)
        );

        return {
          items,
          lastEvaluatedKey: result.LastEvaluatedKey,
          count: result.Count || 0,
        };
      } catch (error) {
        throw handleDynamoDBError(error, 'querying tasks');
      }
    });
  },

  /**
   * Query tasks by status
   */
  async queryByStatus(
    status: 'assigned' | 'in_progress' | 'completed' | 'failed',
    options: QueryOptions = {}
  ): Promise<QueryResult<Task>> {
    return withRetry(async () => {
      try {
        const result = await dynamoDBClient.send(
          new QueryCommand({
            TableName: TABLE_NAMES.TASKS,
            IndexName: 'GSI2',
            KeyConditionExpression: 'GSI2PK = :gsi2pk',
            ExpressionAttributeValues: {
              ':gsi2pk': `STATUS#${status}`,
            },
            Limit: options.limit,
            ExclusiveStartKey: options.startKey,
            ScanIndexForward: options.scanIndexForward ?? false,
          })
        );

        const items = (result.Items || []).map((item) =>
          TaskMapper.fromItem(item as TaskItem)
        );

        return {
          items,
          lastEvaluatedKey: result.LastEvaluatedKey,
          count: result.Count || 0,
        };
      } catch (error) {
        throw handleDynamoDBError(error, 'querying tasks by status');
      }
    });
  },

  /**
   * Delete task
   */
  async delete(shopkeeperId: string, assignedDate: string, taskId: string): Promise<void> {
    return withRetry(async () => {
      try {
        await dynamoDBClient.send(
          new DeleteCommand({
            TableName: TABLE_NAMES.TASKS,
            Key: {
              PK: `SHOPKEEPER#${shopkeeperId}`,
              SK: `TASK#${assignedDate}#${taskId}`,
            },
          })
        );
      } catch (error) {
        throw handleDynamoDBError(error, 'deleting task');
      }
    });
  },
};

// ============================================================================
// WalletTransaction Operations
// ============================================================================

export const WalletTransactionOperations = {
  /**
   * Create a new wallet transaction
   */
  async create(transaction: WalletTransaction): Promise<WalletTransaction> {
    return withRetry(async () => {
      try {
        const item = WalletTransactionMapper.toItem(transaction);
        
        await dynamoDBClient.send(
          new PutCommand({
            TableName: TABLE_NAMES.TRANSACTIONS,
            Item: item,
          })
        );
        
        return transaction;
      } catch (error) {
        throw handleDynamoDBError(error, 'creating transaction');
      }
    });
  },

  /**
   * Get transaction by ID
   */
  async get(transactionId: string): Promise<WalletTransaction> {
    return withRetry(async () => {
      try {
        const result = await dynamoDBClient.send(
          new QueryCommand({
            TableName: TABLE_NAMES.TRANSACTIONS,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
            ExpressionAttributeValues: {
              ':gsi1pk': `TRANSACTION#${transactionId}`,
              ':gsi1sk': 'METADATA',
            },
            Limit: 1,
          })
        );

        if (!result.Items || result.Items.length === 0) {
          throw new ItemNotFoundError('Transaction', transactionId);
        }

        return WalletTransactionMapper.fromItem(result.Items[0] as WalletTransactionItem);
      } catch (error) {
        throw handleDynamoDBError(error, 'getting transaction');
      }
    });
  },

  /**
   * Update transaction status
   */
  async updateStatus(
    transactionId: string,
    shopkeeperId: string,
    timestamp: string,
    status: 'pending' | 'completed' | 'failed'
  ): Promise<WalletTransaction> {
    return withRetry(async () => {
      try {
        const result = await dynamoDBClient.send(
          new UpdateCommand({
            TableName: TABLE_NAMES.TRANSACTIONS,
            Key: {
              PK: `SHOPKEEPER#${shopkeeperId}`,
              SK: `TRANSACTION#${timestamp}#${transactionId}`,
            },
            UpdateExpression: 'SET #Status = :status, #UpdatedAt = :updatedAt',
            ExpressionAttributeNames: {
              '#Status': 'Status',
              '#UpdatedAt': 'UpdatedAt',
            },
            ExpressionAttributeValues: {
              ':status': status,
              ':updatedAt': new Date().toISOString(),
            },
            ConditionExpression: 'attribute_exists(PK)',
            ReturnValues: 'ALL_NEW',
          })
        );

        return WalletTransactionMapper.fromItem(result.Attributes as WalletTransactionItem);
      } catch (error) {
        throw handleDynamoDBError(error, 'updating transaction status');
      }
    });
  },

  /**
   * Query transactions by shopkeeper with date range
   */
  async queryByShopkeeper(
    shopkeeperId: string,
    startTimestamp?: string,
    endTimestamp?: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<WalletTransaction>> {
    return withRetry(async () => {
      try {
        let keyConditionExpression = 'PK = :pk';
        const expressionAttributeValues: Record<string, any> = {
          ':pk': `SHOPKEEPER#${shopkeeperId}`,
        };

        // Add timestamp range filtering if provided
        if (startTimestamp && endTimestamp) {
          keyConditionExpression += ' AND SK BETWEEN :startTime AND :endTime';
          expressionAttributeValues[':startTime'] = `TRANSACTION#${startTimestamp}`;
          expressionAttributeValues[':endTime'] = `TRANSACTION#${endTimestamp}#~`;
        } else if (startTimestamp) {
          keyConditionExpression += ' AND SK >= :startTime';
          expressionAttributeValues[':startTime'] = `TRANSACTION#${startTimestamp}`;
        } else if (endTimestamp) {
          keyConditionExpression += ' AND SK <= :endTime';
          expressionAttributeValues[':endTime'] = `TRANSACTION#${endTimestamp}#~`;
        } else {
          keyConditionExpression += ' AND begins_with(SK, :prefix)';
          expressionAttributeValues[':prefix'] = 'TRANSACTION#';
        }

        const result = await dynamoDBClient.send(
          new QueryCommand({
            TableName: TABLE_NAMES.TRANSACTIONS,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            Limit: options.limit,
            ExclusiveStartKey: options.startKey,
            ScanIndexForward: options.scanIndexForward ?? false,
          })
        );

        const items = (result.Items || []).map((item) =>
          WalletTransactionMapper.fromItem(item as WalletTransactionItem)
        );

        return {
          items,
          lastEvaluatedKey: result.LastEvaluatedKey,
          count: result.Count || 0,
        };
      } catch (error) {
        throw handleDynamoDBError(error, 'querying transactions');
      }
    });
  },

  /**
   * Delete transaction
   */
  async delete(shopkeeperId: string, timestamp: string, transactionId: string): Promise<void> {
    return withRetry(async () => {
      try {
        await dynamoDBClient.send(
          new DeleteCommand({
            TableName: TABLE_NAMES.TRANSACTIONS,
            Key: {
              PK: `SHOPKEEPER#${shopkeeperId}`,
              SK: `TRANSACTION#${timestamp}#${transactionId}`,
            },
          })
        );
      } catch (error) {
        throw handleDynamoDBError(error, 'deleting transaction');
      }
    });
  },
};
