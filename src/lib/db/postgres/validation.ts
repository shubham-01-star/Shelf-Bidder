/**
 * Zod Validation Schemas for PostgreSQL Entities
 * Task 2.1: Data validation schemas using Zod
 * Requirements: 9.1, 9.4
 */

import { z } from 'zod';

// ============================================================================
// Coordinate and Dimension Schemas
// ============================================================================

export const CoordinatesSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const DimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  unit: z.enum(['cm', 'inch']),
});

// ============================================================================
// Product and Empty Space Schemas
// ============================================================================

export const ProductSchema = z.object({
  name: z.string().min(1).max(255),
  brand: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  position: CoordinatesSchema,
});

export const EmptySpaceSchema = z.object({
  id: z.string().min(1),
  coordinates: CoordinatesSchema,
  shelf_level: z.number().int().min(0),
  visibility: z.enum(['high', 'medium', 'low']),
  accessibility: z.enum(['easy', 'moderate', 'difficult']),
});

// ============================================================================
// Placement and Verification Schemas
// ============================================================================

export const PlacementRequirementSchema = z.object({
  type: z.enum(['position', 'visibility', 'proximity', 'orientation']),
  description: z.string().min(1),
  required: z.boolean(),
});

export const PlacementInstructionsSchema = z.object({
  product_name: z.string().min(1).max(255),
  brand_name: z.string().min(1).max(255),
  target_location: EmptySpaceSchema,
  positioning_rules: z.array(z.string()),
  visual_requirements: z.array(z.string()),
  time_limit_hours: z.number().positive(),
});

export const VerificationResultSchema = z.object({
  verified: z.boolean(),
  confidence: z.number().min(0).max(100),
  feedback: z.string(),
  issues: z.array(z.string()).optional(),
  verified_at: z.date(),
});

// ============================================================================
// Shopkeeper Schemas
// ============================================================================

export const ShopkeeperSchema = z.object({
  id: z.string().uuid(),
  shopkeeper_id: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  phone_number: z.string().min(10).max(20),
  email: z.string().email().max(255),
  store_address: z.string().min(1),
  store_location: PointSchema.optional(),
  preferred_language: z.string().length(2).default('en'),
  timezone: z.string().max(50).default('UTC'),
  wallet_balance: z.number().min(0).default(0),
  registration_date: z.date(),
  last_active_date: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateShopkeeperSchema = z.object({
  shopkeeper_id: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  phone_number: z.string().min(10).max(20),
  email: z.string().email().max(255),
  store_address: z.string().min(1),
  preferred_language: z.string().length(2).optional(),
  timezone: z.string().max(50).optional(),
});

export const UpdateShopkeeperSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  store_address: z.string().min(1).optional(),
  preferred_language: z.string().length(2).optional(),
  timezone: z.string().max(50).optional(),
  last_active_date: z.date().optional(),
});

// ============================================================================
// ShelfSpace Schemas
// ============================================================================

export const ShelfSpaceSchema = z.object({
  id: z.string().uuid(),
  shopkeeper_id: z.string().uuid(),
  photo_url: z.string().url(),
  analysis_date: z.date(),
  empty_spaces: z.array(EmptySpaceSchema),
  current_inventory: z.array(ProductSchema),
  analysis_confidence: z.number().int().min(0).max(100),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateShelfSpaceSchema = z.object({
  shopkeeper_id: z.string().uuid(),
  photo_url: z.string().url(),
  empty_spaces: z.array(EmptySpaceSchema),
  current_inventory: z.array(ProductSchema),
  analysis_confidence: z.number().int().min(0).max(100),
});

// ============================================================================
// Campaign Schemas
// ============================================================================

export const CampaignSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().min(1).max(255),
  brand_name: z.string().min(1).max(255),
  product_name: z.string().min(1).max(255),
  product_category: z.string().min(1).max(100),
  budget: z.number().positive(),
  remaining_budget: z.number().min(0),
  payout_per_task: z.number().positive(),
  target_locations: z.array(z.string()).min(1),
  target_radius_km: z.number().positive().default(5.0),
  placement_requirements: z.array(PlacementRequirementSchema),
  product_dimensions: DimensionsSchema,
  start_date: z.date(),
  end_date: z.date(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']),
  created_at: z.date(),
  updated_at: z.date(),
}).refine((data) => data.end_date > data.start_date, {
  message: 'End date must be after start date',
  path: ['end_date'],
}).refine((data) => data.remaining_budget <= data.budget, {
  message: 'Remaining budget cannot exceed total budget',
  path: ['remaining_budget'],
});

export const CreateCampaignSchema = z.object({
  agent_id: z.string().min(1).max(255),
  brand_name: z.string().min(1).max(255),
  product_name: z.string().min(1).max(255),
  product_category: z.string().min(1).max(100),
  budget: z.number().positive(),
  payout_per_task: z.number().positive(),
  target_locations: z.array(z.string()).min(1),
  target_radius_km: z.number().positive().optional(),
  placement_requirements: z.array(PlacementRequirementSchema),
  product_dimensions: DimensionsSchema,
  start_date: z.date(),
  end_date: z.date(),
}).refine((data) => data.end_date > data.start_date, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

// ============================================================================
// Task Schemas
// ============================================================================

export const TaskSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  shopkeeper_id: z.string().uuid(),
  shelf_space_id: z.string().uuid(),
  instructions: PlacementInstructionsSchema,
  status: z.enum(['assigned', 'in_progress', 'completed', 'failed', 'expired']),
  assigned_date: z.date(),
  completed_date: z.date().optional(),
  proof_photo_url: z.string().url().optional(),
  earnings: z.number().min(0),
  verification_result: VerificationResultSchema.optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateTaskSchema = z.object({
  campaign_id: z.string().uuid(),
  shopkeeper_id: z.string().uuid(),
  shelf_space_id: z.string().uuid(),
  instructions: PlacementInstructionsSchema,
  earnings: z.number().positive(),
});

export const UpdateTaskSchema = z.object({
  status: z.enum(['assigned', 'in_progress', 'completed', 'failed', 'expired']).optional(),
  completed_date: z.date().optional(),
  proof_photo_url: z.string().url().optional(),
  verification_result: VerificationResultSchema.optional(),
});

// ============================================================================
// WalletTransaction Schemas
// ============================================================================

export const WalletTransactionSchema = z.object({
  id: z.string().uuid(),
  shopkeeper_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  campaign_id: z.string().uuid().optional(),
  type: z.enum(['earning', 'payout', 'adjustment', 'refund']),
  amount: z.number(),
  description: z.string().min(1),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  transaction_date: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
}).refine((data) => {
  // Earnings and payouts must be positive, adjustments and refunds can be negative
  if (data.type === 'earning' || data.type === 'payout') {
    return data.amount > 0;
  }
  return true;
}, {
  message: 'Earnings and payouts must have positive amounts',
  path: ['amount'],
});

export const CreateTransactionSchema = z.object({
  shopkeeper_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  campaign_id: z.string().uuid().optional(),
  type: z.enum(['earning', 'payout', 'adjustment', 'refund']),
  amount: z.number(),
  description: z.string().min(1),
}).refine((data) => {
  if (data.type === 'earning' || data.type === 'payout') {
    return data.amount > 0;
  }
  return true;
}, {
  message: 'Earnings and payouts must have positive amounts',
  path: ['amount'],
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate data against a schema and return the result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.safeParse(data);
}

/**
 * Validate data against a schema and return the parsed data or null
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate data against a schema and throw an error if invalid
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// ============================================================================
// Type Exports
// ============================================================================

export type ShopkeeperInput = z.infer<typeof ShopkeeperSchema>;
export type CreateShopkeeperInput = z.infer<typeof CreateShopkeeperSchema>;
export type UpdateShopkeeperInput = z.infer<typeof UpdateShopkeeperSchema>;

export type ShelfSpaceInput = z.infer<typeof ShelfSpaceSchema>;
export type CreateShelfSpaceInput = z.infer<typeof CreateShelfSpaceSchema>;

export type CampaignInput = z.infer<typeof CampaignSchema>;
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export type TaskInput = z.infer<typeof TaskSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export type WalletTransactionInput = z.infer<typeof WalletTransactionSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
