/**
 * ShelfSpace Operations
 * Task 2.2: CRUD operations for shelf space analysis
 */

import { query } from '../client';
import { ShelfSpaceMapper } from '../mappers';
import type {
  ShelfSpace,
  ShelfSpaceRow,
  QueryOptions,
  PaginatedResult,
  EmptySpace,
  Product,
} from '../types';
import { NotFoundError, DatabaseError } from '../types';

export const ShelfSpaceOperations = {
  /**
   * Create a new shelf space analysis
   */
  async create(
    shopkeeperId: string,
    photoUrl: string,
    emptySpaces: EmptySpace[],
    currentInventory: Product[],
    analysisConfidence: number
  ): Promise<ShelfSpace> {
    try {
      const sql = `
        INSERT INTO shelf_spaces (
          shopkeeper_id, photo_url, empty_spaces,
          current_inventory, analysis_confidence
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        shopkeeperId,
        photoUrl,
        JSON.stringify(emptySpaces),
        JSON.stringify(currentInventory),
        analysisConfidence,
      ];

      const result = await query<ShelfSpaceRow>(sql, values);

      if (result.rows.length === 0) {
        throw new DatabaseError('Failed to create shelf space');
      }

      console.log('[ShelfSpace] ✅ Created:', result.rows[0].id);
      return ShelfSpaceMapper.fromRow(result.rows[0]);
    } catch (error: any) {
      console.error('[ShelfSpace] ❌ Create error:', error);
      throw error;
    }
  },

  /**
   * Get shelf space by ID
   */
  async getById(id: string): Promise<ShelfSpace> {
    const sql = 'SELECT * FROM shelf_spaces WHERE id = $1';
    const result = await query<ShelfSpaceRow>(sql, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('ShelfSpace', id);
    }

    return ShelfSpaceMapper.fromRow(result.rows[0]);
  },

  /**
   * Get shelf spaces by shopkeeper
   */
  async getByShopkeeper(
    shopkeeperId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<ShelfSpace>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countSql = 'SELECT COUNT(*) as count FROM shelf_spaces WHERE shopkeeper_id = $1';
    const countResult = await query<{ count: string }>(countSql, [shopkeeperId]);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM shelf_spaces
      WHERE shopkeeper_id = $1
      ORDER BY analysis_date DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query<ShelfSpaceRow>(sql, [shopkeeperId, limit, offset]);

    const items = result.rows.map(ShelfSpaceMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get latest shelf space for shopkeeper
   */
  async getLatestByShopkeeper(shopkeeperId: string): Promise<ShelfSpace | null> {
    const sql = `
      SELECT * FROM shelf_spaces
      WHERE shopkeeper_id = $1
      ORDER BY analysis_date DESC
      LIMIT 1
    `;
    const result = await query<ShelfSpaceRow>(sql, [shopkeeperId]);

    if (result.rows.length === 0) {
      return null;
    }

    return ShelfSpaceMapper.fromRow(result.rows[0]);
  },

  /**
   * Get shelf spaces with empty spaces (for campaign matching)
   */
  async getWithEmptySpaces(
    options: QueryOptions = {}
  ): Promise<PaginatedResult<ShelfSpace>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count - only spaces with non-empty empty_spaces array
    const countSql = `
      SELECT COUNT(*) as count FROM shelf_spaces
      WHERE jsonb_array_length(empty_spaces) > 0
        AND analysis_confidence >= 70
    `;
    const countResult = await query<{ count: string }>(countSql);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM shelf_spaces
      WHERE jsonb_array_length(empty_spaces) > 0
        AND analysis_confidence >= 70
      ORDER BY analysis_date DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await query<ShelfSpaceRow>(sql, [limit, offset]);

    const items = result.rows.map(ShelfSpaceMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get shelf spaces by date range
   */
  async getByDateRange(
    shopkeeperId: string,
    startDate: Date,
    endDate: Date,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<ShelfSpace>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countSql = `
      SELECT COUNT(*) as count FROM shelf_spaces
      WHERE shopkeeper_id = $1
        AND analysis_date >= $2
        AND analysis_date <= $3
    `;
    const countResult = await query<{ count: string }>(countSql, [
      shopkeeperId,
      startDate,
      endDate,
    ]);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM shelf_spaces
      WHERE shopkeeper_id = $1
        AND analysis_date >= $2
        AND analysis_date <= $3
      ORDER BY analysis_date DESC
      LIMIT $4 OFFSET $5
    `;
    const result = await query<ShelfSpaceRow>(sql, [
      shopkeeperId,
      startDate,
      endDate,
      limit,
      offset,
    ]);

    const items = result.rows.map(ShelfSpaceMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * List all shelf spaces with pagination
   */
  async list(options: QueryOptions = {}): Promise<PaginatedResult<ShelfSpace>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const orderBy = options.orderBy || 'analysis_date';
    const orderDirection = options.orderDirection || 'DESC';

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM shelf_spaces'
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM shelf_spaces
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $1 OFFSET $2
    `;
    const result = await query<ShelfSpaceRow>(sql, [limit, offset]);

    const items = result.rows.map(ShelfSpaceMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Delete shelf space
   */
  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM shelf_spaces WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('ShelfSpace', id);
    }

    console.log('[ShelfSpace] 🗑️  Deleted:', id);
  },

  /**
   * Delete old shelf spaces (cleanup)
   * Removes shelf spaces older than specified days
   */
  async deleteOlderThan(days: number): Promise<number> {
    const sql = `
      DELETE FROM shelf_spaces
      WHERE analysis_date < CURRENT_TIMESTAMP - INTERVAL '${days} days'
    `;
    const result = await query(sql);

    console.log(`[ShelfSpace] 🗑️  Deleted ${result.rowCount} old shelf spaces (>${days} days)`);
    return result.rowCount || 0;
  },
};
