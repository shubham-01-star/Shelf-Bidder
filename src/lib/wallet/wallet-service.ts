/**
 * Wallet Service - Earnings and Payout Business Logic
 *
 * Task 9.1: Wallet transaction processing
 * Task 9.2: Payout system
 *
 * Manages earnings crediting, balance, transaction history, and payouts.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  WalletTransaction,
  TransactionType,
  TransactionStatus,
} from '@/types/models';
import {
  WalletTransactionOperations,
  ShopkeeperOperations,
} from '@/lib/db';

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

  // Create the transaction
  const transaction: WalletTransaction = {
    id: uuidv4(),
    shopkeeperId,
    type: 'earning' as TransactionType,
    amount,
    description,
    taskId,
    timestamp: new Date().toISOString(),
    status: 'completed' as TransactionStatus,
  };

  // Save transaction
  await WalletTransactionOperations.create(transaction);

  // Update shopkeeper's wallet balance
  const shopkeeper = await ShopkeeperOperations.get(shopkeeperId);
  const newBalance = shopkeeper.walletBalance + amount;

  await ShopkeeperOperations.update(shopkeeperId, {
    walletBalance: newBalance,
    lastActiveDate: new Date().toISOString(),
  });

  return transaction;
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
  const shopkeeper = await ShopkeeperOperations.get(shopkeeperId);
  return shopkeeper.walletBalance;
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
    startDate,
    endDate
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
  ).toISOString();

  const transactions = await getTransactionHistory(
    shopkeeperId,
    startDate
  );

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
 * Creates a pending payout transaction and deducts from balance.
 * The actual payout processing is handled separately.
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
  const shopkeeper = await ShopkeeperOperations.get(shopkeeperId);
  const currentBalance = shopkeeper.walletBalance;

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

  // Create payout transaction (pending until processed)
  const transaction: WalletTransaction = {
    id: uuidv4(),
    shopkeeperId,
    type: 'payout' as TransactionType,
    amount: payoutAmount,
    description: `Payout request - ₹${payoutAmount}`,
    timestamp: new Date().toISOString(),
    status: 'pending' as TransactionStatus,
  };

  // Save transaction
  await WalletTransactionOperations.create(transaction);

  // Deduct from wallet balance
  const newBalance = currentBalance - payoutAmount;
  await ShopkeeperOperations.update(shopkeeperId, {
    walletBalance: newBalance,
  });

  return transaction;
}

/**
 * Complete a pending payout (called after actual payment is made)
 *
 * @param transactionId - The payout transaction to complete
 * @param shopkeeperId - The shopkeeper
 * @param timestamp - The transaction timestamp
 * @returns Updated transaction
 */
export async function completePayout(
  transactionId: string,
  shopkeeperId: string,
  timestamp: string
): Promise<WalletTransaction> {
  return WalletTransactionOperations.updateStatus(
    transactionId,
    shopkeeperId,
    timestamp,
    'completed'
  );
}

/**
 * Fail a payout and refund the amount
 *
 * @param transactionId - The payout transaction that failed
 * @param shopkeeperId - The shopkeeper
 * @param timestamp - The transaction timestamp
 * @returns Updated transaction
 */
export async function failPayout(
  transactionId: string,
  shopkeeperId: string,
  timestamp: string
): Promise<WalletTransaction> {
  // Get the transaction to know the amount
  const transaction = await WalletTransactionOperations.get(transactionId);

  // Refund the amount
  const shopkeeper = await ShopkeeperOperations.get(shopkeeperId);
  await ShopkeeperOperations.update(shopkeeperId, {
    walletBalance: shopkeeper.walletBalance + transaction.amount,
  });

  // Mark transaction as failed
  return WalletTransactionOperations.updateStatus(
    transactionId,
    shopkeeperId,
    timestamp,
    'failed'
  );
}

// ============================================================================
// Exports for constants (for testing)
// ============================================================================

export { PAYOUT_THRESHOLD, MAX_PAYOUT_AMOUNT };
