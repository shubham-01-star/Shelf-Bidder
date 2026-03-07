/**
 * Wallet Service - Earnings and Payout Business Logic
 *
 * Task 9.1: Wallet transaction processing
 * Task 9.2: Payout system
 *
 * Manages earnings crediting, balance, transaction history, and payouts.
 */

import {
  WalletTransactionOperations,
  ShopkeeperOperations,
  TransactionOperations,
} from '@/lib/db/postgres/operations';
import type { WalletTransaction } from '@/lib/db/postgres/types';

// ============================================================================
// Constants
// ============================================================================

/** Minimum balance required to request a payout (in INR) */
const PAYOUT_THRESHOLD = 100;

/** Maximum payout amount per request (in INR) */
const MAX_PAYOUT_AMOUNT = 10000;

// ============================================================================
// Errors
// ============================================================================

export class WalletError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

// ============================================================================
// Earnings Management
// ============================================================================

/**
 * Credit earnings to a shopkeeper's wallet for completing a task
 *
 * Creates a transaction record and updates the shopkeeper's wallet balance.
 *
 * @param shopkeeperId - The shopkeeper to credit
 * @param amount - Amount to credit (in INR)
 * @param taskId - The task that generated these earnings
 * @param description - Description of the earning
 * @returns The created transaction
 */
export async function creditEarnings(
  shopkeeperId: string,
  amount: number,
  taskId: string,
  description: string = 'Task completion payment'
): Promise<WalletTransaction> {
  if (amount <= 0) {
    throw new WalletError(
      'Earnings amount must be positive',
      'INVALID_AMOUNT',
      { amount }
    );
  }

  return WalletTransactionOperations.create({
    shopkeeper_id: shopkeeperId,
    task_id: taskId,
    type: 'earning',
    amount,
    description,
  });
}

// ============================================================================
// Balance Queries
// ============================================================================

/**
 * Get the current wallet balance for a shopkeeper
 *
 * @param shopkeeperId - The shopkeeper to query
 * @returns Current wallet balance
 */
export async function getBalance(shopkeeperId: string): Promise<number> {
  const shopkeeper = await ShopkeeperOperations.getByShopkeeperId(shopkeeperId);
  return shopkeeper.wallet_balance;
}

/**
 * Get transaction history for a shopkeeper
 *
 * @param shopkeeperId - The shopkeeper to query
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Array of transactions
 */
export async function getTransactionHistory(
  shopkeeperId: string,
  startDate?: string,
  endDate?: string
): Promise<WalletTransaction[]> {
  const result = await WalletTransactionOperations.queryByShopkeeper(
    shopkeeperId,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined,
    { limit: 100 }
  );
  return result.items;
}

/**
 * Calculate earnings summary for a shopkeeper
 *
 * @param shopkeeperId - The shopkeeper to query
 * @param periodDays - Number of days to look back (default: 7)
 * @returns Earnings summary object
 */
export async function getEarningsSummary(
  shopkeeperId: string,
  periodDays: number = 7
): Promise<{
  totalEarnings: number;
  totalPayouts: number;
  netBalance: number;
  transactionCount: number;
  period: string;
}> {
  const startDate = new Date(
    Date.now() - periodDays * 24 * 60 * 60 * 1000
  );
  const endDate = new Date();

  const result = await WalletTransactionOperations.queryByShopkeeper(
    shopkeeperId,
    startDate,
    endDate,
    { limit: 1000 }
  );
  const transactions = result.items;

  const totalEarnings = transactions
    .filter((t) => t.type === 'earning' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayouts = transactions
    .filter((t) => t.type === 'payout' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalEarnings,
    totalPayouts,
    netBalance: totalEarnings - totalPayouts,
    transactionCount: transactions.length,
    period: `${periodDays} days`,
  };
}

// ============================================================================
// Payout System
// ============================================================================

/**
 * Check if a shopkeeper is eligible for payout
 *
 * @param shopkeeperId - The shopkeeper to check
 * @returns Whether payout is eligible and current balance
 */
export async function checkPayoutEligibility(
  shopkeeperId: string
): Promise<{ eligible: boolean; balance: number; threshold: number }> {
  const balance = await getBalance(shopkeeperId);
  return {
    eligible: balance >= PAYOUT_THRESHOLD,
    balance,
    threshold: PAYOUT_THRESHOLD,
  };
}

/**
 * Request a payout from the shopkeeper's wallet
 *
 * Uses TransactionOperations.processPayout() for ACID atomicity.
 *
 * @param shopkeeperId - The shopkeeper requesting payout
 * @param amount - Amount to pay out (optional, defaults to full balance)
 * @returns The created payout transaction
 */
export async function requestPayout(
  shopkeeperId: string,
  amount?: number
): Promise<WalletTransaction> {
  // Get current balance
  const shopkeeper = await ShopkeeperOperations.getByShopkeeperId(shopkeeperId);
  const currentBalance = shopkeeper.wallet_balance;

  // Determine payout amount
  const payoutAmount = amount || currentBalance;

  // Validate payout
  if (payoutAmount <= 0) {
    throw new WalletError(
      'Payout amount must be positive',
      'INVALID_PAYOUT_AMOUNT',
      { payoutAmount }
    );
  }

  if (payoutAmount > currentBalance) {
    throw new WalletError(
      `Insufficient balance. Current: ₹${currentBalance}, Requested: ₹${payoutAmount}`,
      'INSUFFICIENT_BALANCE',
      { currentBalance, payoutAmount }
    );
  }

  if (currentBalance < PAYOUT_THRESHOLD) {
    throw new WalletError(
      `Balance below payout threshold. Current: ₹${currentBalance}, Threshold: ₹${PAYOUT_THRESHOLD}`,
      'BELOW_THRESHOLD',
      { currentBalance, threshold: PAYOUT_THRESHOLD }
    );
  }

  if (payoutAmount > MAX_PAYOUT_AMOUNT) {
    throw new WalletError(
      `Payout exceeds maximum limit of ₹${MAX_PAYOUT_AMOUNT}`,
      'EXCEEDS_MAX_PAYOUT',
      { payoutAmount, maxPayout: MAX_PAYOUT_AMOUNT }
    );
  }

  // ACID payout: atomically deducts balance and creates transaction
  const result = await TransactionOperations.processPayout(
    shopkeeperId,
    payoutAmount,
    `Payout request - ₹${payoutAmount}`
  );

  return result.transaction;
}

/**
 * Complete a pending payout (called after actual payment is made)
 *
 * @param transactionId - The payout transaction to complete
 * @returns Updated transaction
 */
export async function completePayout(
  transactionId: string
): Promise<WalletTransaction> {
  // Use raw query since monolithic operations doesn't expose updateStatus for transactions
  const { query } = await import('@/lib/db/postgres/client');
  const { WalletTransactionMapper } = await import('@/lib/db/postgres/mappers');
  type WTRow = import('@/lib/db/postgres/types').WalletTransactionRow;

  const result = await query<WTRow>(
    `UPDATE wallet_transactions SET status = 'completed' WHERE id = $1 RETURNING *`,
    [transactionId]
  );

  if (result.rows.length === 0) {
    throw new WalletError('Transaction not found', 'NOT_FOUND', { transactionId });
  }

  return WalletTransactionMapper.fromRow(result.rows[0]);
}

/**
 * Fail a payout and refund the amount
 *
 * @param transactionId - The payout transaction that failed
 * @param shopkeeperId - The shopkeeper
 * @returns Updated transaction
 */
export async function failPayout(
  transactionId: string,
  shopkeeperId: string
): Promise<WalletTransaction> {
  const { query } = await import('@/lib/db/postgres/client');
  const { WalletTransactionMapper } = await import('@/lib/db/postgres/mappers');
  type WTRow = import('@/lib/db/postgres/types').WalletTransactionRow;

  // Get the transaction to know the amount
  const txn = await WalletTransactionOperations.getById(transactionId);

  // Refund the amount
  await query(
    `UPDATE shopkeepers SET wallet_balance = wallet_balance + $1 WHERE shopkeeper_id = $2`,
    [txn.amount, shopkeeperId]
  );

  // Mark transaction as failed
  const result = await query<WTRow>(
    `UPDATE wallet_transactions SET status = 'failed' WHERE id = $1 RETURNING *`,
    [transactionId]
  );

  if (result.rows.length === 0) {
    throw new WalletError('Transaction not found', 'NOT_FOUND', { transactionId });
  }

  return WalletTransactionMapper.fromRow(result.rows[0]);
}

// ============================================================================
// Exports for constants (for testing)
// ============================================================================

export { PAYOUT_THRESHOLD, MAX_PAYOUT_AMOUNT };
