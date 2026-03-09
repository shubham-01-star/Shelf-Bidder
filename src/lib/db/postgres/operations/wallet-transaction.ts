/**
 * WalletTransaction Operations
 * Task 2.2: ACID-compliant wallet transaction operations
 */

import { query, transaction } from '../client';
import { WalletTransactionMapper } from '../mappers';
import { ShopkeeperOperations } from './shopkeeper';
import type {
  WalletTransaction,
  WalletTransactionRow,
  CreateTransactionInput,
  QueryOptions,
  PaginatedResult,
} from '../types';
import { NotFoundError, DatabaseError } from '../types';

export const WalletTransactionOperations = {
  /**
   * Create a new wallet transaction (ACID transaction)
   * This atomically creates the transaction record and updates shopkeeper balance
   */
  async create(input: CreateTransactionInput): Promise<WalletTransaction> {
    return transaction(async (client) => {
      try {
        // Create transaction record
        const insertSql = `
          INSERT INTO wallet_transactions (
            shopkeeper_id, task_id, campaign_id,
            type, amount, description, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const values = [
          input.shopkeeper_id,
          input.task_id || null,
          input.campaign_id || null,
          input.type,
          input.amount,
          input.description,
          'completed',
        ];

        const result = await client.query<WalletTransactionRow>(insertSql, values);

        if (result.rows.length === 0) {
          throw new DatabaseError('Failed to create wallet transaction');
        }

        const transactionRecord = result.rows[0];

        // Update shopkeeper wallet balance based on transaction type
        const operation = input.type === 'earning' || input.type === 'adjustment' ? 'add' : 'subtract';
        const amount = Math.abs(input.amount);

        // Lock shopkeeper row and update balance
        const lockSql = `
          SELECT * FROM shopkeepers
          WHERE id = $1
          FOR UPDATE
        `;
        const lockResult = await client.query(lockSql, [input.shopkeeper_id]);

        if (lockResult.rows.length === 0) {
          throw new NotFoundError('Shopkeeper', input.shopkeeper_id);
        }

        const currentBalance = parseFloat(lockResult.rows[0].wallet_balance);
        const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;

        if (newBalance < 0) {
          throw new DatabaseError(
            `Insufficient balance: ${currentBalance}, required: ${amount}`
          );
        }

        const updateSql = `
          UPDATE shopkeepers
          SET wallet_balance = $1
          WHERE id = $2
        `;
        await client.query(updateSql, [newBalance, input.shopkeeper_id]);

        console.log(
          `[WalletTransaction] ✅ Created: ${transactionRecord.id} (${input.type} ${input.amount}) - Balance: ${currentBalance} → ${newBalance}`
        );

        return WalletTransactionMapper.fromRow(transactionRecord);
      } catch (error: any) {
        console.error('[WalletTransaction] ❌ Create error:', error);
        throw error;
      }
    });
  },

  /**
   * Create earning transaction (convenience method)
   */
  async createEarning(
    shopkeeperId: string,
    taskId: string,
    amount: number,
    description: string
  ): Promise<WalletTransaction> {
    return this.create({
      shopkeeper_id: shopkeeperId,
      task_id: taskId,
      type: 'earning',
      amount,
      description,
    });
  },

  /**
   * Create payout transaction (convenience method)
   */
  async createPayout(
    shopkeeperId: string,
    amount: number,
    description: string
  ): Promise<WalletTransaction> {
    return this.create({
      shopkeeper_id: shopkeeperId,
      type: 'payout',
      amount,
      description,
    });
  },

  /**
   * Get transaction by ID
   */
  async getById(id: string): Promise<WalletTransaction> {
    const sql = 'SELECT * FROM wallet_transactions WHERE id = $1';
    const result = await query<WalletTransactionRow>(sql, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('WalletTransaction', id);
    }

    return WalletTransactionMapper.fromRow(result.rows[0]);
  },

  /**
   * Get transactions by shopkeeper
   */
  async getByShopkeeper(
    shopkeeperId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<WalletTransaction>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countSql = 'SELECT COUNT(*) as count FROM wallet_transactions WHERE shopkeeper_id = $1';
    const countResult = await query<{ count: string }>(countSql, [shopkeeperId]);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM wallet_transactions
      WHERE shopkeeper_id = $1
      ORDER BY transaction_date DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query<WalletTransactionRow>(sql, [shopkeeperId, limit, offset]);

    const items = result.rows.map(WalletTransactionMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get transactions by task
   */
  async getByTask(taskId: string): Promise<WalletTransaction[]> {
    const sql = `
      SELECT * FROM wallet_transactions
      WHERE task_id = $1
      ORDER BY transaction_date DESC
    `;
    const result = await query<WalletTransactionRow>(sql, [taskId]);

    return result.rows.map(WalletTransactionMapper.fromRow);
  },

  /**
   * Get transactions by type
   */
  async getByType(
    shopkeeperId: string,
    type: WalletTransaction['type'],
    options: QueryOptions = {}
  ): Promise<PaginatedResult<WalletTransaction>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countSql = `
      SELECT COUNT(*) as count FROM wallet_transactions
      WHERE shopkeeper_id = $1 AND type = $2
    `;
    const countResult = await query<{ count: string }>(countSql, [shopkeeperId, type]);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM wallet_transactions
      WHERE shopkeeper_id = $1 AND type = $2
      ORDER BY transaction_date DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await query<WalletTransactionRow>(sql, [shopkeeperId, type, limit, offset]);

    const items = result.rows.map(WalletTransactionMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get transactions by date range
   */
  async getByDateRange(
    shopkeeperId: string,
    startDate: Date,
    endDate: Date,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<WalletTransaction>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countSql = `
      SELECT COUNT(*) as count FROM wallet_transactions
      WHERE shopkeeper_id = $1
        AND transaction_date >= $2
        AND transaction_date <= $3
    `;
    const countResult = await query<{ count: string }>(countSql, [
      shopkeeperId,
      startDate,
      endDate,
    ]);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM wallet_transactions
      WHERE shopkeeper_id = $1
        AND transaction_date >= $2
        AND transaction_date <= $3
      ORDER BY transaction_date DESC
      LIMIT $4 OFFSET $5
    `;
    const result = await query<WalletTransactionRow>(sql, [
      shopkeeperId,
      startDate,
      endDate,
      limit,
      offset,
    ]);

    const items = result.rows.map(WalletTransactionMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get total earnings for shopkeeper
   */
  async getTotalEarnings(shopkeeperId: string): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM wallet_transactions
      WHERE shopkeeper_id = $1
        AND type = 'earning'
        AND status = 'completed'
    `;
    const result = await query<{ total: string }>(sql, [shopkeeperId]);

    return parseFloat(result.rows[0].total);
  },

  /**
   * Get earnings for date range
   */
  async getEarningsForDateRange(
    shopkeeperId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM wallet_transactions
      WHERE shopkeeper_id = $1
        AND type = 'earning'
        AND status = 'completed'
        AND transaction_date >= $2
        AND transaction_date <= $3
    `;
    const result = await query<{ total: string }>(sql, [
      shopkeeperId,
      startDate,
      endDate,
    ]);

    return parseFloat(result.rows[0].total);
  },

  /**
   * Update transaction status
   */
  async updateStatus(
    id: string,
    status: WalletTransaction['status']
  ): Promise<WalletTransaction> {
    const sql = `
      UPDATE wallet_transactions
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await query<WalletTransactionRow>(sql, [status, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('WalletTransaction', id);
    }

    console.log(`[WalletTransaction] ✅ Status updated: ${id} → ${status}`);
    return WalletTransactionMapper.fromRow(result.rows[0]);
  },

  /**
   * List all transactions with pagination
   */
  async list(options: QueryOptions = {}): Promise<PaginatedResult<WalletTransaction>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const orderBy = options.orderBy || 'transaction_date';
    const orderDirection = options.orderDirection || 'DESC';

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM wallet_transactions'
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM wallet_transactions
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $1 OFFSET $2
    `;
    const result = await query<WalletTransactionRow>(sql, [limit, offset]);

    const items = result.rows.map(WalletTransactionMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },
};
