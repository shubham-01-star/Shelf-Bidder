/**
 * Zod validation schemas for Shelf-Bidder data models
 * These schemas provide runtime validation and type safety
 */

import { z } from 'zod';

// ============================================================================
// Shopkeeper Schema
// ============================================================================

export const ShopkeeperSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  storeAddress: z.string().min(1).max(500),
  preferredLanguage: z.string().min(2).max(10),
  timezone: z.string().min(1).max(50),
  walletBalance: z.number().min(0),
  registrationDate: z.string().datetime(),
  lastActiveDate: z.string().datetime(),
});

export type ShopkeeperInput = z.infer<typeof ShopkeeperSchema>;

// ============================================================================
// Shelf Space Schemas
// ============================================================================

export const VisibilitySchema = z.enum(['high', 'medium', 'low']);
export const AccessibilitySchema = z.enum(['easy', 'moderate', 'difficult']);

export const EmptySpaceSchema = z.object({
  id: z.string().uuid(),
  coordinates: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1),
  }),
  shelfLevel: z.number().int().min(1),
  visibility: VisibilitySchema,
  accessibility: AccessibilitySchema,
});

export const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
});

export const ShelfSpaceSchema = z.object({
  id: z.string().uuid(),
  shopkeeperId: z.string().uuid(),
  photoUrl: z.string().url(),
  analysisDate: z.string().datetime(),
  emptySpaces: z.array(EmptySpaceSchema),
  currentInventory: z.array(ProductSchema),
  analysisConfidence: z.number().min(0).max(100),
});

export type EmptySpaceInput = z.infer<typeof EmptySpaceSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
export type ShelfSpaceInput = z.infer<typeof ShelfSpaceSchema>;

// ============================================================================
// Auction Schemas
// ============================================================================

export const AuctionStatusSchema = z.enum(['active', 'completed', 'cancelled']);
export const BidStatusSchema = z.enum(['valid', 'invalid', 'withdrawn']);

export const DimensionsSchema = z.object({
  width: z.number().min(0),
  height: z.number().min(0),
  depth: z.number().min(0).optional(),
});

export const ProductDetailsSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  dimensions: DimensionsSchema,
});

export const BidSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  amount: z.number().min(0),
  productDetails: ProductDetailsSchema,
  timestamp: z.string().datetime(),
  status: BidStatusSchema,
});

export const AuctionSchema = z.object({
  id: z.string().uuid(),
  shelfSpaceId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: AuctionStatusSchema,
  bids: z.array(BidSchema),
  winnerId: z.string().uuid().optional(),
  winningBid: z.number().min(0).optional(),
});

export type DimensionsInput = z.infer<typeof DimensionsSchema>;
export type ProductDetailsInput = z.infer<typeof ProductDetailsSchema>;
export type BidInput = z.infer<typeof BidSchema>;
export type AuctionInput = z.infer<typeof AuctionSchema>;

// ============================================================================
// Task Schemas
// ============================================================================

export const TaskStatusSchema = z.enum(['assigned', 'in_progress', 'completed', 'failed']);

export const PlacementInstructionsSchema = z.object({
  productName: z.string().min(1).max(200),
  brandName: z.string().min(1).max(200),
  targetLocation: EmptySpaceSchema,
  positioningRules: z.array(z.string()),
  visualRequirements: z.array(z.string()),
  timeLimit: z.number().int().min(1),
});

export const VerificationResultSchema = z.object({
  verified: z.boolean(),
  feedback: z.string(),
  confidence: z.number().min(0).max(100),
});

export const TaskSchema = z.object({
  id: z.string().uuid(),
  auctionId: z.string().uuid(),
  shopkeeperId: z.string().uuid(),
  instructions: PlacementInstructionsSchema,
  status: TaskStatusSchema,
  assignedDate: z.string().datetime(),
  completedDate: z.string().datetime().optional(),
  proofPhotoUrl: z.string().url().optional(),
  earnings: z.number().min(0),
  verificationResult: VerificationResultSchema.optional(),
});

export type PlacementInstructionsInput = z.infer<typeof PlacementInstructionsSchema>;
export type VerificationResultInput = z.infer<typeof VerificationResultSchema>;
export type TaskInput = z.infer<typeof TaskSchema>;

// ============================================================================
// Wallet Transaction Schemas
// ============================================================================

export const TransactionTypeSchema = z.enum(['earning', 'payout', 'adjustment']);
export const TransactionStatusSchema = z.enum(['pending', 'completed', 'failed']);

export const WalletTransactionSchema = z.object({
  id: z.string().uuid(),
  shopkeeperId: z.string().uuid(),
  type: TransactionTypeSchema,
  amount: z.number(),
  description: z.string().min(1).max(500),
  taskId: z.string().uuid().optional(),
  timestamp: z.string().datetime(),
  status: TransactionStatusSchema,
});

export type WalletTransactionInput = z.infer<typeof WalletTransactionSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates data against a schema and returns typed result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validates data and returns result with error handling
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
