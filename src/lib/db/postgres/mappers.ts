/**
 * PostgreSQL Row Mappers
 * Task 2.1: Entity mappers for PostgreSQL result transformation
 * Converts database rows to TypeScript objects and vice versa
 */

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
} from './types';

// ============================================================================
// Shopkeeper Mapper
// ============================================================================

export const ShopkeeperMapper = {
  /**
   * Convert database row to Shopkeeper object
   */
  fromRow(row: ShopkeeperRow): Shopkeeper {
    return {
      id: row.id,
      shopkeeper_id: row.shopkeeper_id,
      name: row.name,
      phone_number: row.phone_number,
      email: row.email,
      store_address: row.store_address,
      store_location: row.store_location
        ? parsePoint(row.store_location)
        : undefined,
      preferred_language: row.preferred_language,
      timezone: row.timezone,
      wallet_balance: parseFloat(row.wallet_balance),
      registration_date: row.registration_date,
      last_active_date: row.last_active_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  /**
   * Convert Shopkeeper object to database values
   */
  toRow(shopkeeper: Partial<Shopkeeper>): Partial<ShopkeeperRow> {
    return {
      shopkeeper_id: shopkeeper.shopkeeper_id,
      name: shopkeeper.name,
      phone_number: shopkeeper.phone_number,
      email: shopkeeper.email,
      store_address: shopkeeper.store_address,
      store_location: shopkeeper.store_location
        ? formatPoint(shopkeeper.store_location)
        : undefined,
      preferred_language: shopkeeper.preferred_language,
      timezone: shopkeeper.timezone,
      wallet_balance: shopkeeper.wallet_balance?.toString(),
      registration_date: shopkeeper.registration_date,
      last_active_date: shopkeeper.last_active_date,
    };
  },
};

// ============================================================================
// ShelfSpace Mapper
// ============================================================================

export const ShelfSpaceMapper = {
  /**
   * Convert database row to ShelfSpace object
   */
  fromRow(row: ShelfSpaceRow): ShelfSpace {
    return {
      id: row.id,
      shopkeeper_id: row.shopkeeper_id,
      photo_url: row.photo_url,
      analysis_date: row.analysis_date,
      empty_spaces: Array.isArray(row.empty_spaces)
        ? row.empty_spaces
        : JSON.parse(row.empty_spaces || '[]'),
      current_inventory: Array.isArray(row.current_inventory)
        ? row.current_inventory
        : JSON.parse(row.current_inventory || '[]'),
      analysis_confidence: row.analysis_confidence,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  /**
   * Convert ShelfSpace object to database values
   */
  toRow(shelfSpace: Partial<ShelfSpace>): Partial<ShelfSpaceRow> {
    return {
      shopkeeper_id: shelfSpace.shopkeeper_id,
      photo_url: shelfSpace.photo_url,
      analysis_date: shelfSpace.analysis_date,
      empty_spaces: shelfSpace.empty_spaces
        ? JSON.stringify(shelfSpace.empty_spaces)
        : undefined,
      current_inventory: shelfSpace.current_inventory
        ? JSON.stringify(shelfSpace.current_inventory)
        : undefined,
      analysis_confidence: shelfSpace.analysis_confidence,
    };
  },
};

// ============================================================================
// Campaign Mapper
// ============================================================================

export const CampaignMapper = {
  /**
   * Convert database row to Campaign object
   */
  fromRow(row: CampaignRow): Campaign {
    return {
      id: row.id,
      agent_id: row.agent_id,
      brand_name: row.brand_name,
      product_name: row.product_name,
      product_category: row.product_category,
      budget: parseFloat(row.budget),
      remaining_budget: parseFloat(row.remaining_budget),
      payout_per_task: parseFloat(row.payout_per_task),
      target_locations: row.target_locations,
      target_radius_km: parseFloat(row.target_radius_km),
      placement_requirements:
        typeof row.placement_requirements === 'string'
          ? JSON.parse(row.placement_requirements)
          : row.placement_requirements,
      product_dimensions:
        typeof row.product_dimensions === 'string'
          ? JSON.parse(row.product_dimensions)
          : row.product_dimensions,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status as Campaign['status'],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  /**
   * Convert Campaign object to database values
   */
  toRow(campaign: Partial<Campaign>): Partial<CampaignRow> {
    return {
      agent_id: campaign.agent_id,
      brand_name: campaign.brand_name,
      product_name: campaign.product_name,
      product_category: campaign.product_category,
      budget: campaign.budget?.toString(),
      remaining_budget: campaign.remaining_budget?.toString(),
      payout_per_task: campaign.payout_per_task?.toString(),
      target_locations: campaign.target_locations,
      target_radius_km: campaign.target_radius_km?.toString(),
      placement_requirements: campaign.placement_requirements
        ? JSON.stringify(campaign.placement_requirements)
        : undefined,
      product_dimensions: campaign.product_dimensions
        ? JSON.stringify(campaign.product_dimensions)
        : undefined,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      status: campaign.status,
    };
  },
};

// ============================================================================
// Task Mapper
// ============================================================================

export const TaskMapper = {
  /**
   * Convert database row to Task object
   */
  fromRow(row: TaskRow): Task {
    return {
      id: row.id,
      campaign_id: row.campaign_id,
      shopkeeper_id: row.shopkeeper_id,
      shelf_space_id: row.shelf_space_id,
      instructions:
        typeof row.instructions === 'string'
          ? JSON.parse(row.instructions)
          : row.instructions,
      status: row.status as Task['status'],
      assigned_date: row.assigned_date,
      completed_date: row.completed_date,
      proof_photo_url: row.proof_photo_url,
      earnings: parseFloat(row.earnings),
      verification_result: row.verification_result
        ? typeof row.verification_result === 'string'
          ? JSON.parse(row.verification_result)
          : row.verification_result
        : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  /**
   * Convert Task object to database values
   */
  toRow(task: Partial<Task>): Partial<TaskRow> {
    return {
      campaign_id: task.campaign_id,
      shopkeeper_id: task.shopkeeper_id,
      shelf_space_id: task.shelf_space_id,
      instructions: task.instructions
        ? JSON.stringify(task.instructions)
        : undefined,
      status: task.status,
      assigned_date: task.assigned_date,
      completed_date: task.completed_date,
      proof_photo_url: task.proof_photo_url,
      earnings: task.earnings?.toString(),
      verification_result: task.verification_result
        ? JSON.stringify(task.verification_result)
        : undefined,
    };
  },
};

// ============================================================================
// WalletTransaction Mapper
// ============================================================================

export const WalletTransactionMapper = {
  /**
   * Convert database row to WalletTransaction object
   */
  fromRow(row: WalletTransactionRow): WalletTransaction {
    return {
      id: row.id,
      shopkeeper_id: row.shopkeeper_id,
      task_id: row.task_id,
      campaign_id: row.campaign_id,
      type: row.type as WalletTransaction['type'],
      amount: parseFloat(row.amount),
      description: row.description,
      status: row.status as WalletTransaction['status'],
      transaction_date: row.transaction_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  /**
   * Convert WalletTransaction object to database values
   */
  toRow(
    transaction: Partial<WalletTransaction>
  ): Partial<WalletTransactionRow> {
    return {
      shopkeeper_id: transaction.shopkeeper_id,
      task_id: transaction.task_id,
      campaign_id: transaction.campaign_id,
      type: transaction.type,
      amount: transaction.amount?.toString(),
      description: transaction.description,
      status: transaction.status,
      transaction_date: transaction.transaction_date,
    };
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse PostGIS POINT string to coordinates
 * Format: "POINT(longitude latitude)" or "(longitude,latitude)"
 */
function parsePoint(point: string): { x: number; y: number } | undefined {
  try {
    // Remove "POINT" prefix and parentheses
    const coords = point
      .replace(/POINT\s*\(/i, '')
      .replace(/\)/g, '')
      .replace(/[()]/g, '')
      .split(/[\s,]+/)
      .map(parseFloat);

    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      return { x: coords[0], y: coords[1] };
    }
  } catch (error) {
    console.error('[Mapper] Failed to parse POINT:', point, error);
  }
  return undefined;
}

/**
 * Format coordinates to PostGIS POINT string
 */
function formatPoint(coords: { x: number; y: number }): string {
  return `POINT(${coords.x} ${coords.y})`;
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(json: string | any, fallback: T): T {
  if (typeof json !== 'string') {
    return json as T;
  }

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('[Mapper] Failed to parse JSON:', json, error);
    return fallback;
  }
}
