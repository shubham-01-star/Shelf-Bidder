/**
 * Task Operations
 * Task 2.2: CRUD operations with ACID transactions for tasks
 */

import { query, transaction } from '../client';
import { TaskMapper } from '../mappers';
import type {
  Task,
  TaskRow,
  CreateTaskInput,
  QueryOptions,
  PaginatedResult,
  VerificationResult,
} from '../types';
import { NotFoundError, DatabaseError } from '../types';

export const TaskOperations = {
  /**
   * Create a new task
   */
  async create(input: CreateTaskInput): Promise<Task> {
    try {
      const sql = `
        INSERT INTO tasks (
          campaign_id, shopkeeper_id, shelf_space_id,
          instructions, earnings, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        input.campaign_id,
        input.shopkeeper_id,
        input.shelf_space_id,
        JSON.stringify(input.instructions),
        input.earnings,
        'assigned',
      ];

      const result = await query<TaskRow>(sql, values);

      if (result.rows.length === 0) {
        throw new DatabaseError('Failed to create task');
      }

      console.log('[Task] ✅ Created:', result.rows[0].id);
      return TaskMapper.fromRow(result.rows[0]);
    } catch (error: any) {
      console.error('[Task] ❌ Create error:', error);
      throw error;
    }
  },

  /**
   * Get task by ID
   */
  async getById(id: string): Promise<Task> {
    const sql = 'SELECT * FROM tasks WHERE id = $1';
    const result = await query<TaskRow>(sql, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Task', id);
    }

    return TaskMapper.fromRow(result.rows[0]);
  },

  /**
   * Get tasks by shopkeeper
   */
  async getByShopkeeper(
    shopkeeperId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Task>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countSql = 'SELECT COUNT(*) as count FROM tasks WHERE shopkeeper_id = $1';
    const countResult = await query<{ count: string }>(countSql, [shopkeeperId]);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM tasks
      WHERE shopkeeper_id = $1
      ORDER BY assigned_date DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query<TaskRow>(sql, [shopkeeperId, limit, offset]);

    const items = result.rows.map(TaskMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get tasks by campaign
   */
  async getByCampaign(
    campaignId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Task>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countSql = 'SELECT COUNT(*) as count FROM tasks WHERE campaign_id = $1';
    const countResult = await query<{ count: string }>(countSql, [campaignId]);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM tasks
      WHERE campaign_id = $1
      ORDER BY assigned_date DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query<TaskRow>(sql, [campaignId, limit, offset]);

    const items = result.rows.map(TaskMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get tasks by status
   */
  async getByStatus(
    status: Task['status'],
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Task>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countSql = 'SELECT COUNT(*) as count FROM tasks WHERE status = $1';
    const countResult = await query<{ count: string }>(countSql, [status]);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM tasks
      WHERE status = $1
      ORDER BY assigned_date DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query<TaskRow>(sql, [status, limit, offset]);

    const items = result.rows.map(TaskMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Update task status
   */
  async updateStatus(
    id: string,
    status: Task['status']
  ): Promise<Task> {
    const sql = `
      UPDATE tasks
      SET status = $1,
          completed_date = CASE
            WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP
            ELSE completed_date
          END
      WHERE id = $2
      RETURNING *
    `;

    const result = await query<TaskRow>(sql, [status, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Task', id);
    }

    console.log(`[Task] ✅ Status updated: ${id} → ${status}`);
    return TaskMapper.fromRow(result.rows[0]);
  },

  /**
   * Complete task with verification result (ACID transaction)
   * This updates task status and proof photo atomically
   */
  async completeTask(
    taskId: string,
    proofPhotoUrl: string,
    verificationResult: VerificationResult
  ): Promise<Task> {
    return transaction(async (client) => {
      // Lock the task row
      const lockSql = 'SELECT * FROM tasks WHERE id = $1 FOR UPDATE';
      const lockResult = await client.query<TaskRow>(lockSql, [taskId]);

      if (lockResult.rows.length === 0) {
        throw new NotFoundError('Task', taskId);
      }

      const task = lockResult.rows[0];

      // Verify task is in correct state
      if (task.status === 'completed') {
        throw new DatabaseError('Task already completed');
      }

      // Update task with completion data
      const updateSql = `
        UPDATE tasks
        SET status = $1,
            completed_date = CURRENT_TIMESTAMP,
            proof_photo_url = $2,
            verification_result = $3
        WHERE id = $4
        RETURNING *
      `;

      const updateResult = await client.query<TaskRow>(updateSql, [
        verificationResult.verified ? 'completed' : 'failed',
        proofPhotoUrl,
        JSON.stringify(verificationResult),
        taskId,
      ]);

      console.log(`[Task] ✅ Completed: ${taskId} (verified: ${verificationResult.verified})`);
      return TaskMapper.fromRow(updateResult.rows[0]);
    });
  },

  /**
   * Update task proof photo
   */
  async updateProofPhoto(
    id: string,
    proofPhotoUrl: string
  ): Promise<Task> {
    const sql = `
      UPDATE tasks
      SET proof_photo_url = $1,
          status = 'in_progress'
      WHERE id = $2
      RETURNING *
    `;

    const result = await query<TaskRow>(sql, [proofPhotoUrl, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Task', id);
    }

    console.log(`[Task] 📸 Proof photo updated: ${id}`);
    return TaskMapper.fromRow(result.rows[0]);
  },

  /**
   * List all tasks with pagination
   */
  async list(options: QueryOptions = {}): Promise<PaginatedResult<Task>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const orderBy = options.orderBy || 'assigned_date';
    const orderDirection = options.orderDirection || 'DESC';

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM tasks'
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM tasks
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $1 OFFSET $2
    `;
    const result = await query<TaskRow>(sql, [limit, offset]);

    const items = result.rows.map(TaskMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Delete task
   */
  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM tasks WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Task', id);
    }

    console.log('[Task] 🗑️  Deleted:', id);
  },
};
