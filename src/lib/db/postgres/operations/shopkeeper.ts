/**
 * Shopkeeper Operations
 * Task 2.2: CRUD operations with ACID transactions
 */

import { query, transaction } from '../client';
import { ShopkeeperMapper } from '../mappers';
import type {
  Shopkeeper,
  ShopkeeperRow,
  CreateShopkeeperInput,
  UpdateShopkeeperInput,
  QueryOptions,
  PaginatedResult,
} from '../types';
import { NotFoundError, DuplicateError, DatabaseError } from '../types';

export const ShopkeeperOperations = {
  /**
   * Create a new shopkeeper
   */
  async create(input: CreateShopkeeperInput): Promise<Shopkeeper> {
    try {
      const sql = `
        INSERT INTO shopkeepers (
          shopkeeper_id, name, phone_number, email, store_address,
          preferred_language, timezone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        input.shopkeeper_id,
        input.name,
        input.phone_number,
        input.email,
        input.store_address,
        input.preferred_language || 'en',
        input.timezone || 'UTC',
      ];

      const result = await query<ShopkeeperRow>(sql, values);

      if (result.rows.length === 0) {
        throw new DatabaseError('Failed to create shopkeeper');
      }

      console.log('[Shopkeeper] ✅ Created:', result.rows[0].shopkeeper_id);
      return ShopkeeperMapper.fromRow(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique violation
        throw new DuplicateError(
          'Shopkeeper',
          'phone_number or email',
          input.phone_number
        );
      }
      throw error;
    }
  },

  /**
   * Get shopkeeper by ID (UUID)
   */
  async getById(id: string): Promise<Shopkeeper> {
    const sql = 'SELECT * FROM shopkeepers WHERE id = $1';
    const result = await query<ShopkeeperRow>(sql, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Shopkeeper', id);
    }

    return ShopkeeperMapper.fromRow(result.rows[0]);
  },

  /**
   * Get shopkeeper by shopkeeper_id (Cognito ID)
   */
  async getByShopkeeperId(shopkeeperId: string): Promise<Shopkeeper> {
    const sql = 'SELECT * FROM shopkeepers WHERE shopkeeper_id = $1';
    const result = await query<ShopkeeperRow>(sql, [shopkeeperId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Shopkeeper', shopkeeperId);
    }

    return ShopkeeperMapper.fromRow(result.rows[0]);
  },

  /**
   * Get shopkeeper by phone number
   */
  async getByPhoneNumber(phoneNumber: string): Promise<Shopkeeper> {
    const sql = 'SELECT * FROM shopkeepers WHERE phone_number = $1';
    const result = await query<ShopkeeperRow>(sql, [phoneNumber]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Shopkeeper', phoneNumber);
    }

    return ShopkeeperMapper.fromRow(result.rows[0]);
  },

  /**
   * Update shopkeeper
   */
  async update(
    id: string,
    updates: UpdateShopkeeperInput
  ): Promise<Shopkeeper> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.store_address !== undefined) {
      fields.push(`store_address = $${paramIndex++}`);
      values.push(updates.store_address);
    }
    if (updates.preferred_language !== undefined) {
      fields.push(`preferred_language = $${paramIndex++}`);
      values.push(updates.preferred_language);
    }
    if (updates.timezone !== undefined) {
      fields.push(`timezone = $${paramIndex++}`);
      values.push(updates.timezone);
    }
    if (updates.last_active_date !== undefined) {
      fields.push(`last_active_date = $${paramIndex++}`);
      values.push(updates.last_active_date);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const sql = `
      UPDATE shopkeepers
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query<ShopkeeperRow>(sql, values);

    if (result.rows.length === 0) {
      throw new NotFoundError('Shopkeeper', id);
    }

    console.log('[Shopkeeper] ✅ Updated:', result.rows[0].shopkeeper_id);
    return ShopkeeperMapper.fromRow(result.rows[0]);
  },

  /**
   * Update wallet balance (ACID transaction)
   * This uses row-level locking to prevent concurrent updates
   */
  async updateWalletBalance(
    shopkeeperId: string,
    amount: number,
    operation: 'add' | 'subtract'
  ): Promise<Shopkeeper> {
    return transaction(async (client) => {
      // Lock the row for update
      const lockSql = `
        SELECT * FROM shopkeepers
        WHERE shopkeeper_id = $1
        FOR UPDATE
      `;
      const lockResult = await client.query<ShopkeeperRow>(lockSql, [
        shopkeeperId,
      ]);

      if (lockResult.rows.length === 0) {
        throw new NotFoundError('Shopkeeper', shopkeeperId);
      }

      const currentBalance = parseFloat(
        lockResult.rows[0].wallet_balance
      );

      // Calculate new balance
      const newBalance =
        operation === 'add'
          ? currentBalance + amount
          : currentBalance - amount;

      if (newBalance < 0) {
        throw new DatabaseError(
          `Insufficient balance: ${currentBalance}, required: ${amount}`
        );
      }

      // Update balance
      const updateSql = `
        UPDATE shopkeepers
        SET wallet_balance = $1
        WHERE shopkeeper_id = $2
        RETURNING *
      `;
      const updateResult = await client.query<ShopkeeperRow>(updateSql, [
        newBalance,
        shopkeeperId,
      ]);

      console.log(
        `[Shopkeeper] 💰 Wallet ${operation}: ${shopkeeperId} ${currentBalance} → ${newBalance}`
      );

      return ShopkeeperMapper.fromRow(updateResult.rows[0]);
    });
  },

  /**
   * List shopkeepers with pagination
   */
  async list(
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Shopkeeper>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const orderBy = options.orderBy || 'created_at';
    const orderDirection = options.orderDirection || 'DESC';

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM shopkeepers'
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM shopkeepers
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $1 OFFSET $2
    `;
    const result = await query<ShopkeeperRow>(sql, [limit, offset]);

    const items = result.rows.map(ShopkeeperMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Delete shopkeeper (soft delete by setting inactive)
   */
  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM shopkeepers WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Shopkeeper', id);
    }

    console.log('[Shopkeeper] 🗑️  Deleted:', id);
  },
};
