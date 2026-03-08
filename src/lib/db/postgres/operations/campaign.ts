/**
 * Campaign Operations
 * Task 2.2: CRUD operations with ACID transactions for campaigns
 */

import { query, transaction } from '../client';
import { CampaignMapper } from '../mappers';
import prisma from '@/lib/prisma';
import { isLocationMatch } from '@/lib/utils/location';
import type {
  Campaign,
  CampaignRow,
  CreateCampaignInput,
  QueryOptions,
  PaginatedResult,
} from '../types';
import { NotFoundError, DatabaseError, InsufficientFundsError } from '../types';

export const CampaignOperations = {
  /**
   * Create a new campaign
   */
  async create(input: CreateCampaignInput): Promise<Campaign> {
    try {
      const sql = `
        INSERT INTO campaigns (
          agent_id, brand_name, product_name, product_category,
          budget, remaining_budget, payout_per_task,
          target_locations, target_radius_km,
          placement_requirements, product_dimensions,
          start_date, end_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
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
        'active',
      ];

      const result = await query<CampaignRow>(sql, values);

      if (result.rows.length === 0) {
        throw new DatabaseError('Failed to create campaign');
      }

      console.log('[Campaign] ✅ Created:', result.rows[0].id);
      return CampaignMapper.fromRow(result.rows[0]);
    } catch (error: any) {
      console.error('[Campaign] ❌ Create error:', error);
      throw error;
    }
  },

  /**
   * Get campaign by ID
   */
  async getById(id: string): Promise<Campaign> {
    const sql = 'SELECT * FROM campaigns WHERE id = $1';
    const result = await query<CampaignRow>(sql, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Campaign', id);
    }

    return CampaignMapper.fromRow(result.rows[0]);
  },

  /**
   * Get active campaigns with available budget
   */
  async getActiveCampaigns(options: QueryOptions = {}): Promise<PaginatedResult<Campaign>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countSql = `
      SELECT COUNT(*) as count FROM campaigns
      WHERE status = 'active'
        AND remaining_budget > 0
        AND start_date <= CURRENT_TIMESTAMP
        AND end_date >= CURRENT_TIMESTAMP
    `;
    const countResult = await query<{ count: string }>(countSql);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM campaigns
      WHERE status = 'active'
        AND remaining_budget > 0
        AND start_date <= CURRENT_TIMESTAMP
        AND end_date >= CURRENT_TIMESTAMP
      ORDER BY remaining_budget DESC, created_at ASC
      LIMIT $1 OFFSET $2
    `;
    const result = await query<CampaignRow>(sql, [limit, offset]);

    const items = result.rows.map(CampaignMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Find matching campaigns for a location
   * Uses flexible location-based filtering with case-insensitive partial matching
   * Supports regional matching (e.g., "Delhi NCR" matches "Delhi", "Gurgaon", "Noida")
   */
  async findMatchingCampaigns(
    location: string,
    minBudget: number,
    options: QueryOptions = {}
  ): Promise<Campaign[]> {
    const limit = options.limit || 10;

    console.log(`[Campaign] 🔍 Finding campaigns for location: "${location}", minBudget: ${minBudget}`);

    // Fetch all active campaigns that meet basic criteria
    const campaigns = await prisma.campaigns.findMany({
      where: {
        status: 'active',
        remaining_budget: {
          gte: minBudget,
        },
        start_date: {
          lte: new Date(),
        },
        end_date: {
          gte: new Date(),
        },
      },
      orderBy: {
        payout_per_task: 'desc',
      },
    });

    console.log(`[Campaign] 📊 Total active campaigns: ${campaigns.length}`);
    
    // Debug: Log all campaigns and their locations
    campaigns.forEach((c: any, i: number) => {
      console.log(`[Campaign] ${i + 1}. ${c.brand_name} - ${c.product_name}`);
      console.log(`[Campaign]    Locations: ${JSON.stringify(c.target_locations)}`);
      console.log(`[Campaign]    Budget: ₹${c.remaining_budget}`);
    });

    // Filter using flexible location matching with normalization
    console.log(`[Campaign] 🔍 Location to match: "${location}"`);
    
    const matchedCampaigns = campaigns.filter((campaign: any) => {
      console.log(`[Campaign] 🔎 Checking campaign: ${campaign.brand_name} - ${campaign.product_name}`);
      console.log(`[Campaign]    Target locations: ${JSON.stringify(campaign.target_locations)}`);
      
      const hasMatch = campaign.target_locations.some((targetLocation: string) => {
        const matches = isLocationMatch(location, targetLocation);
        console.log(`[Campaign]    isLocationMatch("${location}", "${targetLocation}") = ${matches}`);
        if (matches) {
          console.log(`[Campaign] ✓ Match found: "${targetLocation}" matches "${location}"`);
        }
        return matches;
      });
      
      console.log(`[Campaign]    Final result for this campaign: ${hasMatch ? 'MATCHED' : 'NO MATCH'}`);
      return hasMatch;
    }).slice(0, limit);

    console.log(`[Campaign] ✅ Found ${matchedCampaigns.length} matching campaigns for location: ${location}`);
    if (matchedCampaigns.length > 0) {
      console.log(`[Campaign] 🎯 Top campaign: ${matchedCampaigns[0].brand_name} - ${matchedCampaigns[0].product_name} (₹${matchedCampaigns[0].payout_per_task})`);
    }
    
    // Convert Prisma results to CampaignRow format (Decimal -> string for numeric fields)
    const campaignRows: CampaignRow[] = matchedCampaigns.map((c: any) => ({
      id: c.id,
      agent_id: c.agent_id,
      brand_id: c.brand_id,
      brand_name: c.brand_name,
      product_name: c.product_name,
      product_category: c.product_category,
      budget: c.budget.toString(),
      remaining_budget: c.remaining_budget.toString(),
      payout_per_task: c.payout_per_task.toString(),
      target_locations: c.target_locations,
      target_radius_km: c.target_radius_km.toString(),
      placement_requirements: c.placement_requirements,
      product_dimensions: c.product_dimensions,
      start_date: c.start_date,
      end_date: c.end_date,
      status: c.status,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
    
    return campaignRows.map(CampaignMapper.fromRow);
  },

  /**
   * Deduct budget from campaign (ACID transaction with row-level locking)
   * This is critical for preventing race conditions in campaign matching
   */
  async deductBudget(
    campaignId: string,
    amount: number
  ): Promise<Campaign> {
    return transaction(async (client) => {
      // Lock the campaign row for update
      const lockSql = `
        SELECT * FROM campaigns
        WHERE id = $1
        FOR UPDATE
      `;
      const lockResult = await client.query<CampaignRow>(lockSql, [campaignId]);

      if (lockResult.rows.length === 0) {
        throw new NotFoundError('Campaign', campaignId);
      }

      const campaign = lockResult.rows[0];
      const currentBudget = parseFloat(campaign.remaining_budget);

      // Check if sufficient budget
      if (currentBudget < amount) {
        throw new InsufficientFundsError(currentBudget, amount);
      }

      const newBudget = currentBudget - amount;

      // Update budget and status if depleted
      const updateSql = `
        UPDATE campaigns
        SET remaining_budget = $1,
            status = CASE
              WHEN $1 <= 0 THEN 'completed'
              ELSE status
            END
        WHERE id = $2
        RETURNING *
      `;
      const updateResult = await client.query<CampaignRow>(updateSql, [
        newBudget,
        campaignId,
      ]);

      console.log(
        `[Campaign] 💰 Budget deducted: ${campaignId} ${currentBudget} → ${newBudget}`
      );

      return CampaignMapper.fromRow(updateResult.rows[0]);
    });
  },

  /**
   * Update campaign status
   */
  async updateStatus(
    id: string,
    status: 'active' | 'paused' | 'completed' | 'cancelled'
  ): Promise<Campaign> {
    const sql = `
      UPDATE campaigns
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await query<CampaignRow>(sql, [status, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Campaign', id);
    }

    console.log(`[Campaign] ✅ Status updated: ${id} → ${status}`);
    return CampaignMapper.fromRow(result.rows[0]);
  },

  /**
   * Get campaigns by agent
   */
  async getByAgent(
    agentId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Campaign>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countSql = 'SELECT COUNT(*) as count FROM campaigns WHERE agent_id = $1';
    const countResult = await query<{ count: string }>(countSql, [agentId]);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM campaigns
      WHERE agent_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query<CampaignRow>(sql, [agentId, limit, offset]);

    const items = result.rows.map(CampaignMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * List all campaigns with pagination
   */
  async list(options: QueryOptions = {}): Promise<PaginatedResult<Campaign>> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const orderBy = options.orderBy || 'created_at';
    const orderDirection = options.orderDirection || 'DESC';

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM campaigns'
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const sql = `
      SELECT * FROM campaigns
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $1 OFFSET $2
    `;
    const result = await query<CampaignRow>(sql, [limit, offset]);

    const items = result.rows.map(CampaignMapper.fromRow);

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Delete campaign
   */
  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM campaigns WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Campaign', id);
    }

    console.log('[Campaign] 🗑️  Deleted:', id);
  },
};
