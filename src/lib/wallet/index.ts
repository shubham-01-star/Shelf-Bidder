/**
 * Wallet Module Exports
 *
 * Task 9: Wallet System and Earnings Management
 */

export {
  creditEarnings,
  getBalance,
  getTransactionHistory,
  getEarningsSummary,
  checkPayoutEligibility,
  requestPayout,
  completePayout,
  failPayout,
  WalletError,
  PAYOUT_THRESHOLD,
  MAX_PAYOUT_AMOUNT,
} from './wallet-service';
