/**
 * PostgreSQL Database Types
 * Task 2.1: TypeScript interfaces and data models for PostgreSQL
 */

// ============================================================================
// Core Entity Types (matching PostgreSQL schema)
// ============================================================================

export interface Shopkeeper {
  id: string;
  shopkeeper_id: string; // For backward compatibility with Cognito
  name: string;
  phone_number: string;
  email: string;
  store_address: string;
  store_location?: { x: number; y: number }; // PostGIS POINT
  preferred_language: string;
  timezone: string;
  wallet_balance: number;
  registration_date: Date;
  last_active_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ShelfSpace {
  id: string;
  shopkeeper_id: string;
  photo_url: string;
  analysis_date: Date;
  empty_spaces: EmptySpace[];
  current_inventory: Product[];
  analysis_confidence: number;
  created_at: Date;
  updated_at: Date;
}

export interface EmptySpace {
  id: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  shelf_level: number;
  visibility: 'high' | 'medium' | 'low';
  accessibility: 'easy' | 'moderate' | 'difficult';
}

export interface Product {
  name: string;
  brand: string;
  category: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Campaign {
  id: string;
  agent_id: string;
  brand_name: string;
  product_name: string;
  product_category: string;
  budget: number;
  remaining_budget: number;
  payout_per_task: number;
  target_locations: string[];
  target_radius_km: number;
  placement_requirements: PlacementRequirement[];
  product_dimensions: Dimensions;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface PlacementRequirement {
  type: 'position' | 'visibility' | 'proximity' | 'orientation';
  description: string;
  required: boolean;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
  unit: 'cm' | 'inch';
}

export interface Task {
  id: string;
  campaign_id: string;
  shopkeeper_id: string;
  shelf_space_id: string;
  instructions: PlacementInstructions;
  status: 'assigned' | 'in_progress' | 'completed' | 'failed' | 'expired';
  assigned_date: Date;
  completed_date?: Date;
  proof_photo_url?: string;
  earnings: number;
  verification_result?: VerificationResult;
  created_at: Date;
  updated_at: Date;
}

export interface PlacementInstructions {
  product_name: string;
  brand_name: string;
  target_location: EmptySpace;
  positioning_rules: string[];
  visual_requirements: string[];
  time_limit_hours: number;
}

export interface VerificationResult {
  verified: boolean;
  confidence: number;
  feedback: string;
  issues?: string[];
  verified_at: Date;
}

export interface WalletTransaction {
  id: string;
  shopkeeper_id: string;
  task_id?: string;
  campaign_id?: string;
  type: 'earning' | 'payout' | 'adjustment' | 'refund';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_date: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Database Row Types (as returned from PostgreSQL)
// ============================================================================

export interface ShopkeeperRow {
  id: string;
  shopkeeper_id: string;
  name: string;
  phone_number: string;
  email: string;
  store_address: string;
  store_location?: string; // PostGIS POINT as string
  preferred_language: string;
  timezone: string;
  wallet_balance: string; // DECIMAL as string
  registration_date: Date;
  last_active_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ShelfSpaceRow {
  id: string;
  shopkeeper_id: string;
  photo_url: string;
  analysis_date: Date;
  empty_spaces: any; // JSONB
  current_inventory: any; // JSONB
  analysis_confidence: number;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignRow {
  id: string;
  agent_id: string;
  brand_name: string;
  product_name: string;
  product_category: string;
  budget: string; // DECIMAL as string
  remaining_budget: string; // DECIMAL as string
  payout_per_task: string; // DECIMAL as string
  target_locations: string[]; // TEXT[]
  target_radius_km: string; // DECIMAL as string
  placement_requirements: any; // JSONB
  product_dimensions: any; // JSONB
  start_date: Date;
  end_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface TaskRow {
  id: string;
  campaign_id: string;
  shopkeeper_id: string;
  shelf_space_id: string;
  instructions: any; // JSONB
  status: string;
  assigned_date: Date;
  completed_date?: Date;
  proof_photo_url?: string;
  earnings: string; // DECIMAL as string
  verification_result?: any; // JSONB
  created_at: Date;
  updated_at: Date;
}

export interface WalletTransactionRow {
  id: string;
  shopkeeper_id: string;
  task_id?: string;
  campaign_id?: string;
  type: string;
  amount: string; // DECIMAL as string
  description: string;
  status: string;
  transaction_date: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Query Options and Results
// ============================================================================

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// View Types (for dashboard queries)
// ============================================================================

export interface ActiveCampaignView {
  id: string;
  agent_id: string;
  brand_name: string;
  product_name: string;
  budget: number;
  remaining_budget: number;
  payout_per_task: number;
  total_tasks: number;
  completed_tasks: number;
  total_spent: number;
  start_date: Date;
  end_date: Date;
}

export interface ShopkeeperDashboardView {
  id: string;
  shopkeeper_id: string;
  name: string;
  wallet_balance: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  today_earnings: number;
  weekly_earnings: number;
}

// ============================================================================
// Input Types (for creating/updating entities)
// ============================================================================

export interface CreateShopkeeperInput {
  shopkeeper_id: string;
  name: string;
  phone_number: string;
  email: string;
  store_address: string;
  preferred_language?: string;
  timezone?: string;
}

export interface UpdateShopkeeperInput {
  name?: string;
  store_address?: string;
  preferred_language?: string;
  timezone?: string;
  last_active_date?: Date;
}

export interface CreateCampaignInput {
  agent_id: string;
  brand_name: string;
  product_name: string;
  product_category: string;
  budget: number;
  payout_per_task: number;
  target_locations: string[];
  target_radius_km?: number;
  placement_requirements: PlacementRequirement[];
  product_dimensions: Dimensions;
  start_date: Date;
  end_date: Date;
}

export interface CreateTaskInput {
  campaign_id: string;
  shopkeeper_id: string;
  shelf_space_id: string;
  instructions: PlacementInstructions;
  earnings: number;
}

export interface CreateTransactionInput {
  shopkeeper_id: string;
  task_id?: string;
  campaign_id?: string;
  type: 'earning' | 'payout' | 'adjustment' | 'refund';
  amount: number;
  description: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public detail?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends DatabaseError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class DuplicateError extends DatabaseError {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} already exists with ${field}: ${value}`, 'DUPLICATE');
    this.name = 'DuplicateError';
  }
}

export class InsufficientFundsError extends DatabaseError {
  constructor(available: number, required: number) {
    super(
      `Insufficient funds: available ${available}, required ${required}`,
      'INSUFFICIENT_FUNDS'
    );
    this.name = 'InsufficientFundsError';
  }
}
