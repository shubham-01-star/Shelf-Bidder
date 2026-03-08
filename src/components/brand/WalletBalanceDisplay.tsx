'use client';

/**
 * Wallet Balance Display Component
 * Feature: brand-dashboard-redesign
 * Task: 12.1 Create wallet balance display
 * 
 * Displays current wallet balance, escrowed funds, and total spend
 */

interface WalletBalanceDisplayProps {
  balance: number;
  escrowedFunds: number;
  totalSpent: number;
  onRecharge: () => void;
}

export default function WalletBalanceDisplay({
  balance,
  escrowedFunds,
  totalSpent,
  onRecharge,
}: WalletBalanceDisplayProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4">
      {/* Main Balance Card with Gradient */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-[1.5rem] p-6 text-white shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90 mb-1">Available Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
          </div>
          <button
            onClick={onRecharge}
            className="bg-white text-purple-600 py-2 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Recharge
          </button>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Escrowed Funds */}
        <div className="bg-white rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <p className="text-xs text-[#64748b] mb-1">Escrowed Funds</p>
          <p className="text-lg font-bold text-[#1e293b]">{formatCurrency(escrowedFunds)}</p>
          <p className="text-xs text-[#64748b] mt-1">Locked in bids</p>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <p className="text-xs text-[#64748b] mb-1">Total Ad Spend</p>
          <p className="text-lg font-bold text-[#1e293b]">{formatCurrency(totalSpent)}</p>
          <p className="text-xs text-[#64748b] mt-1">All time</p>
        </div>
      </div>
    </div>
  );
}
