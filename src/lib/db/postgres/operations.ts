/**
 * PostgreSQL CRUD Operations Layer
 * Task 2.2: Implement PostgreSQL operations with ACID transactions
 * Requirements: 9.1, 9.2, 9.5, 9.6
 */

import { PoolClient } from 'pg';
import { query, getClient, transaction } from './client';
import {
  ShopkeeperMapper,
  ShelfSpaceMapper,
  CampaignMapper,
  TaskMapper,
  WalletTransactionMapper,
} from './mappers';
import type {
  Shopkeeper,
  ShopkeeperRow,
  ShelfSpace,
  ShelfSpaceRow,
  Campaign,
  CampaignRow,
  Task,
  TaskRow,
  WalletTransaction,
  WalletTransactionRow,
  CreateShopkeeperInput,
  UpdateShopkeeperInput,
  CreateCampaignInput,
  CreateTaskInput,
  CreateTransactionInput,
  QueryOptions,
  PaginatedResult,
} from './types';
import {
  NotFoundError,
  DuplicateError,
  InsufficientFundsError,
  DatabaseError,
} from './types';

// ============================================================================
// Retry Logic Configuration
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

/**
 * Retry wrapper for database operations
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Retry on connection errors, deadlocks, and serialization failures
    const shouldRetry =
      error instanceof Error &&
      (error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('deadlock') ||
        error.message.includes('serialization failure') ||
        error.message.includes('connection') ||
        error.message.includes('timeout'));

    if (shouldRetry && retries > 0) {
      console.log(
        `[PostgreSQL Retry] Retrying operation, ${retries} attempts remaining`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY_MS * (MAX_RETRIES - retries + 1))
      );
      return withRetry(operation, retries - 1);
    }

    throw error;
  }
}

/**
 * Handle PostgreSQL errors and convert to custom error types
 */
function handleError(error: any, operation: string): never {
  console.error(`[PostgreSQL Error] ${operation}:`, error);

  // Unique constraint violation
  if (error.code === '23505') {
    const match = error.detail?.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
    if (match) {
      throw new DuplicateError('Entity', match[1], match[2]);
    }
    throw new DuplicateError('Entity', 'unknown', 'unknown');
  }

  // Foreign key violation
  if (error.code === '23503') {
    throw new DatabaseError('Foreign key constraint violation', error.code);
  }

  // Check constraint violation
  if (error.code === '23514') {
    throw new DatabaseError('Check constraint violation', error.code);
  }

  // Not null violation
  if (error.code === '23502') {
    throw new DatabaseError('Required field missing', error.code);
  }

  throw new DatabaseError(
    error.message || 'Database operation failed',
    error.code
  );
}

// ============================================================================
// Shopkeeper Operations
// ============================================================================

export const ShopkeeperOperations = {
  /**
   * Create a new shopkeeper
   */
  async create(input: CreateShopkeeperInput): Promise<Shopkeeper> {
    return withRetry(async () => {
      try {
        const result = await query<ShopkeeperRow>(
          `INSERT INTO shopkeepers (
            shopkeeper_id, name, phone_number, email, store_address,
            preferred_language, timezone
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [
            input.shopkeeper_id,
            input.name,
            input.phone_number,
            input.email,
            input.store_address,
            input.preferred_language || 'en',
            input.timezone || 'UTC',
          ]
        );

        return ShopkeeperMapper.fromRow(result.rows[0]);
      } catch (error) {
        throw handleError(error, 'creating shopkeeper');
      }
    });
  },

  /**
   * Get shopkeeper by ID
   */
  async getById(id: string): Promise<Shopkeeper> {
    return withRetry(async () => {
      try {
        const result = await query<ShopkeeperRow>(
          'SELECT * FROM shopkeepers WHERE id = $1',
          [id]
        );

        if (result.rows.length === 0) {
          throw new NotFoundError('Shopkeeper', id);
        }

        return ShopkeeperMapper.fromRow(result.rows[0]);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'getting shopkeeper by id');
      }
    });
  },

  /**
   * Get shopkeeper by shopkeeper_id (Cognito ID)
   */
  async getByShopkeeperId(shopkeeperId: string): Promise<Shopkeeper> {
    return withRetry(async () => {
      try {
        const result = await query<ShopkeeperRow>(
          'SELECT * FROM shopkeepers WHERE shopkeeper_id = $1',
          [shopkeeperId]
        );

        if (result.rows.length === 0) {
          throw new NotFoundError('Shopkeeper', shopkeeperId);
        }

        return ShopkeeperMapper.fromRow(result.rows[0]);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'getting shopkeeper by shopkeeper_id');
      }
    });
  },
  /**
   * Update shopkeeper with row-level locking
   */
  async update(
    id: string,
    updates: UpdateShopkeeperInput
  ): Promise<Shopkeeper> {
    return transaction(async (client) => {
      try {
        // Lock the row for update
        const lockResult = await client.query<ShopkeeperRow>(
          'SELECT * FROM shopkeepers WHERE id = $1 FOR UPDATE',
          [id]
        );

        if (lockResult.rows.length === 0) {
          throw new NotFoundError('Shopkeeper', id);
        }

        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.name !== undefined) {
          setClauses.push(`name = $${paramIndex++}`);
          values.push(updates.name);
        }
        if (updates.store_address !== undefined) {
          setClauses.push(`store_address = $${paramIndex++}`);
          values.push(updates.store_address);
        }
        if (updates.preferred_language !== undefined) {
          setClauses.push(`preferred_language = $${paramIndex++}`);
          values.push(updates.preferred_language);
        }
        if (updates.timezone !== undefined) {
          setClauses.push(`timezone = $${paramIndex++}`);
          values.push(updates.timezone);
        }
        if (updates.last_active_date !== undefined) {
          setClauses.push(`last_active_date = $${paramIndex++}`);
          values.push(updates.last_active_date);
        }

        if (setClauses.length === 0) {
          return ShopkeeperMapper.fromRow(lockResult.rows[0]);
        }

        values.push(id);
        const result = await client.query<ShopkeeperRow>(
          `UPDATE shopkeepers SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
          values
        );

        return ShopkeeperMapper.fromRow(result.rows[0]);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'updating shopkeeper');
      }
    });
  },

  /**
   * Delete shopkeeper
   */
  async delete(id: string): Promise<void> {
    return withRetry(async () => {
      try {
        const result = await query('DELETE FROM shopkeepers WHERE id = $1', [
          id,
        ]);

        if (result.rowCount === 0) {
          throw new NotFoundError('Shopkeeper', id);
        }
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'deleting shopkeeper');
      }
    });
  },

  /**
   * List all shopkeepers with pagination
   */
  async list(options: QueryOptions = {}): Promise<PaginatedResult<Shopkeeper>> {
    return withRetry(async () => {
      try {
        const limit = options.limit || 20;
        const offset = options.offset || 0;
        const orderBy = options.orderBy || 'created_at';
        const orderDirection = options.orderDirection || 'DESC';

        const countResult = await query<{ count: string }>(
          'SELECT COUNT(*) as count FROM shopkeepers'
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await query<ShopkeeperRow>(
          `SELECT * FROM shopkeepers ORDER BY ${orderBy} ${orderDirection} LIMIT $1 OFFSET $2`,
          [limit, offset]
        );

        const items = result.rows.map(ShopkeeperMapper.fromRow);

        return {
          items,
          total,
          page: Math.floor(offset / limit) + 1,
          pageSize: limit,
          hasMore: offset + limit < total,
        };
      } catch (error) {
        throw handleError(error, 'listing shopkeepers');
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
  async create(shelfSpace: Omit<ShelfSpace, 'id' | 'created_at' | 'updated_at'>): Promise<ShelfSpace> {
    return withRetry(async () => {
      try {
        const result = await query<ShelfSpaceRow>(
          `INSERT INTO shelf_spaces (
            shopkeeper_id, photo_url, analysis_date, empty_spaces,
            current_inventory, analysis_confidence
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [
            shelfSpace.shopkeeper_id,
            shelfSpace.photo_url,
            shelfSpace.analysis_date,
            JSON.stringify(shelfSpace.empty_spaces),
            JSON.stringify(shelfSpace.current_inventory),
            shelfSpace.analysis_confidence,
          ]
        );

        return ShelfSpaceMapper.fromRow(result.rows[0]);
      } catch (error) {
        throw handleError(error, 'creating shelf space');
      }
    });
  },

  /**
   * Get shelf space by ID
   */
  async getById(id: string): Promise<ShelfSpace> {
    return withRetry(async () => {
      try {
        const result = await query<ShelfSpaceRow>(
          'SELECT * FROM shelf_spaces WHERE id = $1',
          [id]
        );

        if (result.rows.length === 0) {
          throw new NotFoundError('ShelfSpace', id);
        }

        return ShelfSpaceMapper.fromRow(result.rows[0]);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'getting shelf space');
      }
    });
  },

  /**
   * Query shelf spaces by shopkeeper with date range
   */
  async queryByShopkeeper(
    shopkeeperId: string,
    startDate?: Date,
    endDate?: Date,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<ShelfSpace>> {
    return withRetry(async () => {
      try {
        const limit = options.limit || 20;
        const offset = options.offset || 0;

        let whereClause = 'WHERE shopkeeper_id = $1';
        const params: any[] = [shopkeeperId];
        let paramIndex = 2;

        if (startDate) {
          whereClause += ` AND analysis_date >= $${paramIndex++}`;
          params.push(startDate);
        }
        if (endDate) {
          whereClause += ` AND analysis_date <= $${paramIndex++}`;
          params.push(endDate);
        }

        const countResult = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM shelf_spaces ${whereClause}`,
          params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit, offset);
        const result = await query<ShelfSpaceRow>(
          `SELECT * FROM shelf_spaces ${whereClause} 
           ORDER BY analysis_date DESC 
           LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
          params
        );

        const items = result.rows.map(ShelfSpaceMapper.fromRow);

        return {
          items,
          total,
          page: Math.floor(offset / limit) + 1,
          pageSize: limit,
          hasMore: offset + limit < total,
        };
      } catch (error) {
        throw handleError(error, 'querying shelf spaces by shopkeeper');
      }
    });
  },

  /**
   * Delete shelf space
   */
  async delete(id: string): Promise<void> {
    return withRetry(async () => {
      try {
        const result = await query('DELETE FROM shelf_spaces WHERE id = $1', [
          id,
        ]);

        if (result.rowCount === 0) {
          throw new NotFoundError('ShelfSpace', id);
        }
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'deleting shelf space');
      }
    });
  },
};

// ============================================================================
// Campaign Operations
// ============================================================================

export const CampaignOperations = {
  /**
   * Create a new campaign
   */
  async create(input: CreateCampaignInput): Promise<Campaign> {
    return withRetry(async () => {
      try {
        const result = await query<CampaignRow>(
          `INSERT INTO campaigns (
            agent_id, brand_name, product_name, product_category,
            budget, remaining_budget, payout_per_task, target_locations,
            target_radius_km, placement_requirements, product_dimensions,
            start_date, end_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *`,
          [
            input.agent_id,
            input.brand_name,
            input.product_name,
            input.product_category,
            input.budget,
            input.budget, // remaining_budget starts equal to budget
            input.payout_per_task,
            input.target_locations,
            input.target_radius_km || 5.0,
            JSON.stringify(input.placement_requirements),
            JSON.stringify(input.product_dimensions),
            input.start_date,
            input.end_date,
          ]
        );

        return CampaignMapper.fromRow(result.rows[0]);
      } catch (error) {
        throw handleError(error, 'creating campaign');
      }
    });
  },

  /**
   * Get campaign by ID
   */
  async getById(id: string): Promise<Campaign> {
    return withRetry(async () => {
      try {
        const result = await query<CampaignRow>(
          'SELECT * FROM campaigns WHERE id = $1',
          [id]
        );

        if (result.rows.length === 0) {
          throw new NotFoundError('Campaign', id);
        }

        return CampaignMapper.fromRow(result.rows[0]);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'getting campaign');
      }
    });
  },

  /**
   * Find matching campaigns for a location with budget availability
   * Complex query for campaign matching
   */
  async findMatchingCampaigns(
    location: string,
    requiredBudget: number,
    category?: string
  ): Promise<Campaign[]> {
    return withRetry(async () => {
      try {
        let whereClause = `
          WHERE status = 'active'
          AND remaining_budget >= $1
          AND start_date <= CURRENT_TIMESTAMP
          AND end_date >= CURRENT_TIMESTAMP
          AND $2 = ANY(target_locations)
        `;
        const params: any[] = [requiredBudget, location];

        if (category) {
          whereClause += ' AND product_category = $3';
          params.push(category);
        }

        const result = await query<CampaignRow>(
          `SELECT * FROM campaigns ${whereClause}
           ORDER BY remaining_budget DESC, created_at ASC
           LIMIT 10`,
          params
        );

        return result.rows.map(CampaignMapper.fromRow);
      } catch (error) {
        throw handleError(error, 'finding matching campaigns');
      }
    });
  },

  /**
   * Deduct budget from campaign with row-level locking (ACID transaction)
   */
  async deductBudget(
    campaignId: string,
    amount: number
  ): Promise<Campaign> {
    return transaction(async (client) => {
      try {
        // Lock the campaign row for update
        const lockResult = await client.query<CampaignRow>(
          'SELECT * FROM campaigns WHERE id = $1 FOR UPDATE',
          [campaignId]
        );

        if (lockResult.rows.length === 0) {
          throw new NotFoundError('Campaign', campaignId);
        }

        const campaign = CampaignMapper.fromRow(lockResult.rows[0]);

        // Check if sufficient budget is available
        if (campaign.remaining_budget < amount) {
          throw new InsufficientFundsError(campaign.remaining_budget, amount);
        }

        // Deduct the budget
        const result = await client.query<CampaignRow>(
          `UPDATE campaigns 
           SET remaining_budget = remaining_budget - $1,
               status = CASE 
                 WHEN remaining_budget - $1 <= 0 THEN 'completed'
                 ELSE status
               END
           WHERE id = $2
           RETURNING *`,
          [amount, campaignId]
        );

        return CampaignMapper.fromRow(result.rows[0]);
      } catch (error) {
        if (error instanceof NotFoundError || error instanceof InsufficientFundsError) {
          throw error;
        }
        throw handleError(error, 'deducting campaign budget');
      }
    });
  },
  /**
   * Update campaign status
   */
  async updateStatus(
    id: string,
    status: 'active' | 'paused' | 'completed' | 'cancelled'
  ): Promise<Campaign> {
    return withRetry(async () => {
      try {
        const result = await query<CampaignRow>(
          'UPDATE campaigns SET status = $1 WHERE id = $2 RETURNING *',
          [status, id]
        );

        if (result.rows.length === 0) {
          throw new NotFoundError('Campaign', id);
        }

        return CampaignMapper.fromRow(result.rows[0]);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'updating campaign status');
      }
    });
  },

  /**
   * Query campaigns by agent
   */
  async queryByAgent(
    agentId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Campaign>> {
    return withRetry(async () => {
      try {
        const limit = options.limit || 20;
        const offset = options.offset || 0;

        const countResult = await query<{ count: string }>(
          'SELECT COUNT(*) as count FROM campaigns WHERE agent_id = $1',
          [agentId]
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await query<CampaignRow>(
          `SELECT * FROM campaigns 
           WHERE agent_id = $1 
           ORDER BY created_at DESC 
           LIMIT $2 OFFSET $3`,
          [agentId, limit, offset]
        );

        const items = result.rows.map(CampaignMapper.fromRow);

        return {
          items,
          total,
          page: Math.floor(offset / limit) + 1,
          pageSize: limit,
          hasMore: offset + limit < total,
        };
      } catch (error) {
        throw handleError(error, 'querying campaigns by agent');
      }
    });
  },

  /**
   * Query active campaigns
   */
  async queryActive(options: QueryOptions = {}): Promise<PaginatedResult<Campaign>> {
    return withRetry(async () => {
      try {
        const limit = options.limit || 20;
        const offset = options.offset || 0;

        const countResult = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM campaigns 
           WHERE status = 'active' 
           AND remaining_budget > 0
           AND start_date <= CURRENT_TIMESTAMP
           AND end_date >= CURRENT_TIMESTAMP`
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await query<CampaignRow>(
          `SELECT * FROM campaigns 
           WHERE status = 'active' 
           AND remaining_budget > 0
           AND start_date <= CURRENT_TIMESTAMP
           AND end_date >= CURRENT_TIMESTAMP
           ORDER BY remaining_budget DESC 
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );

        const items = result.rows.map(CampaignMapper.fromRow);

        return {
          items,
          total,
          page: Math.floor(offset / limit) + 1,
          pageSize: limit,
          hasMore: offset + limit < total,
        };
      } catch (error) {
        throw handleError(error, 'querying active campaigns');
      }
    });
  },

  /**
   * Delete campaign
   */
  async delete(id: string): Promise<void> {
    return withRetry(async () => {
      try {
        const result = await query('DELETE FROM campaigns WHERE id = $1', [id]);

        if (result.rowCount === 0) {
          throw new NotFoundError('Campaign', id);
        }
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'deleting campaign');
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
  async create(input: CreateTaskInput): Promise<Task> {
    return withRetry(async () => {
      try {
        const result = await query<TaskRow>(
          `INSERT INTO tasks (
            campaign_id, shopkeeper_id, shelf_space_id,
            instructions, earnings
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *`,
          [
            input.campaign_id,
            input.shopkeeper_id,
            input.shelf_space_id,
            JSON.stringify(input.instructions),
            input.earnings,
          ]
        );

        return TaskMapper.fromRow(result.rows[0]);
      } catch (error) {
        throw handleError(error, 'creating task');
      }
    });
  },

  /**
   * Get task by ID
   */
  async getById(id: string): Promise<Task> {
    return withRetry(async () => {
      try {
        const result = await query<TaskRow>(
          'SELECT * FROM tasks WHERE id = $1',
          [id]
        );

        if (result.rows.length === 0) {
          throw new NotFoundError('Task', id);
        }

        return TaskMapper.fromRow(result.rows[0]);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'getting task');
      }
    });
  },

  /**
   * Update task status with row-level locking
   */
  async updateStatus(
    id: string,
    status: 'assigned' | 'in_progress' | 'completed' | 'failed' | 'expired',
    proofPhotoUrl?: string,
    verificationResult?: any
  ): Promise<Task> {
    return transaction(async (client) => {
      try {
        // Lock the task row for update
        const lockResult = await client.query<TaskRow>(
          'SELECT * FROM tasks WHERE id = $1 FOR UPDATE',
          [id]
        );

        if (lockResult.rows.length === 0) {
          throw new NotFoundError('Task', id);
        }

        const updates: string[] = ['status = $1'];
        const params: any[] = [status];
        let paramIndex = 2;

        if (status === 'completed') {
          updates.push(`completed_date = CURRENT_TIMESTAMP`);
        }

        if (proofPhotoUrl) {
          updates.push(`proof_photo_url = $${paramIndex++}`);
          params.push(proofPhotoUrl);
        }

        if (verificationResult) {
          updates.push(`verification_result = $${paramIndex++}`);
          params.push(JSON.stringify(verificationResult));
        }

        params.push(id);
        const result = await client.query<TaskRow>(
          `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
          params
        );

        return TaskMapper.fromRow(result.rows[0]);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'updating task status');
      }
    });
  },

  /**
   * Query tasks by shopkeeper
   */
  async queryByShopkeeper(
    shopkeeperId: string,
    status?: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Task>> {
    return withRetry(async () => {
      try {
        const limit = options.limit || 20;
        const offset = options.offset || 0;

        let whereClause = 'WHERE shopkeeper_id = $1';
        const params: any[] = [shopkeeperId];

        if (status) {
          whereClause += ' AND status = $2';
          params.push(status);
        }

        const countResult = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM tasks ${whereClause}`,
          params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit, offset);
        const result = await query<TaskRow>(
          `SELECT * FROM tasks ${whereClause} 
           ORDER BY assigned_date DESC 
           LIMIT $${params.length - 1} OFFSET $${params.length}`,
          params
        );

        const items = result.rows.map(TaskMapper.fromRow);

        return {
          items,
          total,
          page: Math.floor(offset / limit) + 1,
          pageSize: limit,
          hasMore: offset + limit < total,
        };
      } catch (error) {
        throw handleError(error, 'querying tasks by shopkeeper');
      }
    });
  },

  /**
   * Query tasks by campaign
   */
  async queryByCampaign(
    campaignId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Task>> {
    return withRetry(async () => {
      try {
        const limit = options.limit || 20;
        const offset = options.offset || 0;

        const countResult = await query<{ count: string }>(
          'SELECT COUNT(*) as count FROM tasks WHERE campaign_id = $1',
          [campaignId]
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await query<TaskRow>(
          `SELECT * FROM tasks 
           WHERE campaign_id = $1 
           ORDER BY assigned_date DESC 
           LIMIT $2 OFFSET $3`,
          [campaignId, limit, offset]
        );

        const items = result.rows.map(TaskMapper.fromRow);

        return {
          items,
          total,
          page: Math.floor(offset / limit) + 1,
          pageSize: limit,
          hasMore: offset + limit < total,
        };
      } catch (error) {
        throw handleError(error, 'querying tasks by campaign');
      }
    });
  },

  /**
   * Delete task
   */
  async delete(id: string): Promise<void> {
    return withRetry(async () => {
      try {
        const result = await query('DELETE FROM tasks WHERE id = $1', [id]);

        if (result.rowCount === 0) {
          throw new NotFoundError('Task', id);
        }
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'deleting task');
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
  async create(input: CreateTransactionInput): Promise<WalletTransaction> {
    return withRetry(async () => {
      try {
        const result = await query<WalletTransactionRow>(
          `INSERT INTO wallet_transactions (
            shopkeeper_id, task_id, campaign_id, type, amount, description
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [
            input.shopkeeper_id,
            input.task_id || null,
            input.campaign_id || null,
            input.type,
            input.amount,
            input.description,
          ]
        );

        return WalletTransactionMapper.fromRow(result.rows[0]);
      } catch (error) {
        throw handleError(error, 'creating wallet transaction');
      }
    });
  },

  /**
   * Get transaction by ID
   */
  async getById(id: string): Promise<WalletTransaction> {
    return withRetry(async () => {
      try {
        const result = await query<WalletTransactionRow>(
          'SELECT * FROM wallet_transactions WHERE id = $1',
          [id]
        );

        if (result.rows.length === 0) {
          throw new NotFoundError('WalletTransaction', id);
        }

        return WalletTransactionMapper.fromRow(result.rows[0]);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'getting wallet transaction');
      }
    });
  },

  /**
   * Query transactions by shopkeeper with date range
   */
  async queryByShopkeeper(
    shopkeeperId: string,
    startDate?: Date,
    endDate?: Date,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<WalletTransaction>> {
    return withRetry(async () => {
      try {
        const limit = options.limit || 20;
        const offset = options.offset || 0;

        let whereClause = 'WHERE shopkeeper_id = $1';
        const params: any[] = [shopkeeperId];
        let paramIndex = 2;

        if (startDate) {
          whereClause += ` AND transaction_date >= $${paramIndex++}`;
          params.push(startDate);
        }
        if (endDate) {
          whereClause += ` AND transaction_date <= $${paramIndex++}`;
          params.push(endDate);
        }

        const countResult = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM wallet_transactions ${whereClause}`,
          params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit, offset);
        const result = await query<WalletTransactionRow>(
          `SELECT * FROM wallet_transactions ${whereClause} 
           ORDER BY transaction_date DESC 
           LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
          params
        );

        const items = result.rows.map(WalletTransactionMapper.fromRow);

        return {
          items,
          total,
          page: Math.floor(offset / limit) + 1,
          pageSize: limit,
          hasMore: offset + limit < total,
        };
      } catch (error) {
        throw handleError(error, 'querying wallet transactions');
      }
    });
  },

  /**
   * Get shopkeeper balance
   */
  async getBalance(shopkeeperId: string): Promise<number> {
    return withRetry(async () => {
      try {
        const result = await query<{ wallet_balance: string }>(
          'SELECT wallet_balance FROM shopkeepers WHERE id = $1',
          [shopkeeperId]
        );

        if (result.rows.length === 0) {
          throw new NotFoundError('Shopkeeper', shopkeeperId);
        }

        return parseFloat(result.rows[0].wallet_balance);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw handleError(error, 'getting shopkeeper balance');
      }
    });
  },
};

// ============================================================================
// ACID Transaction Operations
// ============================================================================

export const TransactionOperations = {
  /**
   * Campaign budget deduction with task creation (ACID transaction)
   * Requirements: 3.3, 3.6, 9.1, 9.6
   */
  async deductBudgetAndCreateTask(
    campaignId: string,
    taskInput: CreateTaskInput
  ): Promise<{ campaign: Campaign; task: Task }> {
    return transaction(async (client) => {
      try {
        // 1. Lock and check campaign budget
        const campaignResult = await client.query<CampaignRow>(
          'SELECT * FROM campaigns WHERE id = $1 FOR UPDATE',
          [campaignId]
        );

        if (campaignResult.rows.length === 0) {
          throw new NotFoundError('Campaign', campaignId);
        }

        const campaign = CampaignMapper.fromRow(campaignResult.rows[0]);

        if (campaign.remaining_budget < taskInput.earnings) {
          throw new InsufficientFundsError(
            campaign.remaining_budget,
            taskInput.earnings
          );
        }

        // 2. Deduct budget from campaign
        const updatedCampaignResult = await client.query<CampaignRow>(
          `UPDATE campaigns 
           SET remaining_budget = remaining_budget - $1,
               status = CASE 
                 WHEN remaining_budget - $1 <= 0 THEN 'completed'
                 ELSE status
               END
           WHERE id = $2
           RETURNING *`,
          [taskInput.earnings, campaignId]
        );

        // 3. Create task
        const taskResult = await client.query<TaskRow>(
          `INSERT INTO tasks (
            campaign_id, shopkeeper_id, shelf_space_id,
            instructions, earnings
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *`,
          [
            taskInput.campaign_id,
            taskInput.shopkeeper_id,
            taskInput.shelf_space_id,
            JSON.stringify(taskInput.instructions),
            taskInput.earnings,
          ]
        );

        return {
          campaign: CampaignMapper.fromRow(updatedCampaignResult.rows[0]),
          task: TaskMapper.fromRow(taskResult.rows[0]),
        };
      } catch (error) {
        if (
          error instanceof NotFoundError ||
          error instanceof InsufficientFundsError
        ) {
          throw error;
        }
        throw handleError(error, 'deducting budget and creating task');
      }
    });
  },

  /**
   * Complete task and credit earnings (ACID transaction)
   * Requirements: 5.4, 5.6, 6.1, 6.6, 9.1, 9.6
   */
  async completeTaskAndCreditEarnings(
    taskId: string,
    proofPhotoUrl: string,
    verificationResult: any
  ): Promise<{ task: Task; transaction: WalletTransaction; newBalance: number }> {
    return transaction(async (client) => {
      try {
        // 1. Lock and update task
        const taskLockResult = await client.query<TaskRow>(
          'SELECT * FROM tasks WHERE id = $1 FOR UPDATE',
          [taskId]
        );

        if (taskLockResult.rows.length === 0) {
          throw new NotFoundError('Task', taskId);
        }

        const task = TaskMapper.fromRow(taskLockResult.rows[0]);

        if (task.status === 'completed') {
          throw new DatabaseError('Task already completed', 'ALREADY_COMPLETED');
        }

        // 2. Update task to completed
        const updatedTaskResult = await client.query<TaskRow>(
          `UPDATE tasks 
           SET status = 'completed',
               completed_date = CURRENT_TIMESTAMP,
               proof_photo_url = $1,
               verification_result = $2
           WHERE id = $3
           RETURNING *`,
          [proofPhotoUrl, JSON.stringify(verificationResult), taskId]
        );

        const updatedTask = TaskMapper.fromRow(updatedTaskResult.rows[0]);

        // 3. Lock shopkeeper and credit wallet
        const shopkeeperLockResult = await client.query<ShopkeeperRow>(
          'SELECT * FROM shopkeepers WHERE id = $1 FOR UPDATE',
          [updatedTask.shopkeeper_id]
        );

        if (shopkeeperLockResult.rows.length === 0) {
          throw new NotFoundError('Shopkeeper', updatedTask.shopkeeper_id);
        }

        const updatedShopkeeperResult = await client.query<ShopkeeperRow>(
          `UPDATE shopkeepers 
           SET wallet_balance = wallet_balance + $1
           WHERE id = $2
           RETURNING wallet_balance`,
          [updatedTask.earnings, updatedTask.shopkeeper_id]
        );

        const newBalance = parseFloat(
          updatedShopkeeperResult.rows[0].wallet_balance
        );

        // 4. Create wallet transaction record
        const transactionResult = await client.query<WalletTransactionRow>(
          `INSERT INTO wallet_transactions (
            shopkeeper_id, task_id, campaign_id, type, amount, description
          ) VALUES ($1, $2, $3, 'earning', $4, $5)
          RETURNING *`,
          [
            updatedTask.shopkeeper_id,
            taskId,
            updatedTask.campaign_id,
            updatedTask.earnings,
            `Task completion earnings for campaign ${updatedTask.campaign_id}`,
          ]
        );

        return {
          task: updatedTask,
          transaction: WalletTransactionMapper.fromRow(
            transactionResult.rows[0]
          ),
          newBalance,
        };
      } catch (error) {
        if (error instanceof NotFoundError || error instanceof DatabaseError) {
          throw error;
        }
        throw handleError(error, 'completing task and crediting earnings');
      }
    });
  },

  /**
   * Process payout with locked transaction (ACID transaction)
   * Requirements: 6.4, 6.5, 9.1, 9.6
   */
  async processPayout(
    shopkeeperId: string,
    amount: number,
    description: string
  ): Promise<{ transaction: WalletTransaction; newBalance: number }> {
    return transaction(async (client) => {
      try {
        // 1. Lock shopkeeper and check balance
        const shopkeeperResult = await client.query<ShopkeeperRow>(
          'SELECT * FROM shopkeepers WHERE id = $1 FOR UPDATE',
          [shopkeeperId]
        );

        if (shopkeeperResult.rows.length === 0) {
          throw new NotFoundError('Shopkeeper', shopkeeperId);
        }

        const currentBalance = parseFloat(
          shopkeeperResult.rows[0].wallet_balance
        );

        if (currentBalance < amount) {
          throw new InsufficientFundsError(currentBalance, amount);
        }

        // 2. Deduct from wallet
        const updatedShopkeeperResult = await client.query<ShopkeeperRow>(
          `UPDATE shopkeepers 
           SET wallet_balance = wallet_balance - $1
           WHERE id = $2
           RETURNING wallet_balance`,
          [amount, shopkeeperId]
        );

        const newBalance = parseFloat(
          updatedShopkeeperResult.rows[0].wallet_balance
        );

        // 3. Create payout transaction record
        const transactionResult = await client.query<WalletTransactionRow>(
          `INSERT INTO wallet_transactions (
            shopkeeper_id, type, amount, description, status
          ) VALUES ($1, 'payout', $2, $3, 'pending')
          RETURNING *`,
          [shopkeeperId, amount, description]
        );

        return {
          transaction: WalletTransactionMapper.fromRow(
            transactionResult.rows[0]
          ),
          newBalance,
        };
      } catch (error) {
        if (
          error instanceof NotFoundError ||
          error instanceof InsufficientFundsError
        ) {
          throw error;
        }
        throw handleError(error, 'processing payout');
      }
    });
  },
};

