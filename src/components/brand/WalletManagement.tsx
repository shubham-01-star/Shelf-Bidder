'use client';

/**
 * Wallet Management Component
 * Feature: brand-dashboard-redesign
 * Task: 12.4 Implement recharge submission logic
 * 
 * Container for wallet balance, transaction history, and recharge functionality
 */

import { useState } from 'react';
import WalletBalanceDisplay from './WalletBalanceDisplay';
import TransactionHistory from './TransactionHistory';
import RechargeModal from './RechargeModal';
import { submitRecharge } from '@/lib/api';

interface WalletManagementProps {
  balance: number;
  escrowedFunds: number;
  totalSpent: number;
  onBalanceUpdate?: (newBalance: number) => void;
}

export default function WalletManagement({
  balance,
  escrowedFunds,
  totalSpent,
  onBalanceUpdate,
}: WalletManagementProps) {
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(balance);

  const handleRecharge = () => {
    setIsRechargeModalOpen(true);
  };

  const handleRechargeSubmit = async (amount: number) => {
    try {
      setRechargeLoading(true);

      const brandId = localStorage.getItem('brandId') || 'b1';
      const brandToken = localStorage.getItem('brandToken');

      if (!brandToken) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Submit recharge request
      await submitRecharge({
        brandId,
        amount,
        paymentMethod: 'card',
      });

      // Update balance
      const newBalance = currentBalance + amount;
      setCurrentBalance(newBalance);
      
      if (onBalanceUpdate) {
        onBalanceUpdate(newBalance);
      }

      // Show success message
      alert(`Wallet recharged successfully! Added ${formatCurrency(amount)}`);

      // Close modal
      setIsRechargeModalOpen(false);

      // Reload page to refresh transaction history
      window.location.reload();
    } catch (err) {
      console.error('Recharge error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to recharge wallet';
      alert(errorMessage);
      throw err; // Re-throw to keep modal open
    } finally {
      setRechargeLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Display */}
      <WalletBalanceDisplay
        balance={currentBalance}
        escrowedFunds={escrowedFunds}
        totalSpent={totalSpent}
        onRecharge={handleRecharge}
      />

      {/* Transaction History */}
      <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-semibold text-[#1e293b] mb-4">
          Transaction History
        </h3>
        <TransactionHistory />
      </div>

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        onSubmit={handleRechargeSubmit}
        loading={rechargeLoading}
      />
    </div>
  );
}
