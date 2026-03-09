'use client';

/**
 * Recharge Modal Component
 * Feature: brand-dashboard-redesign
 * Task: 12.3 Build recharge modal
 * 
 * Modal for wallet recharge with quick-select amounts and validation
 */

import { useState } from 'react';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
  loading?: boolean;
}

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];
const MIN_AMOUNT = 1000;

export default function RechargeModal({ isOpen, onClose, onSubmit, loading = false }: RechargeModalProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    setSelectedAmount(null);
    
    const amount = parseFloat(value);
    if (value && (isNaN(amount) || amount < MIN_AMOUNT)) {
      setError(`Minimum recharge amount is ₹${MIN_AMOUNT.toLocaleString('en-IN')}`);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || isNaN(amount)) {
      setError('Please select or enter an amount');
      return;
    }
    
    if (amount < MIN_AMOUNT) {
      setError(`Minimum recharge amount is ₹${MIN_AMOUNT.toLocaleString('en-IN')}`);
      return;
    }

    try {
      await onSubmit(amount);
      // Reset form on success
      setCustomAmount('');
      setSelectedAmount(null);
      setError(null);
    } catch (err) {
      // Error handling is done in parent component
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-[1.5rem] max-w-md w-full p-8 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1e293b]">Recharge Wallet</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#64748b] hover:text-[#1e293b] transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Quick Select Buttons */}
        <div className="mb-6">
          <p className="text-sm font-medium text-[#1e293b] mb-3">Quick Select</p>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickSelect(amount)}
                disabled={loading}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  selectedAmount === amount
                    ? 'bg-[#ff5c61] text-white'
                    : 'bg-[#f8f5f5] text-[#1e293b] hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div className="mb-6">
          <label htmlFor="customAmount" className="block text-sm font-medium text-[#1e293b] mb-2">
            Or Enter Custom Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]">₹</span>
            <input
              type="number"
              id="customAmount"
              value={customAmount}
              onChange={handleCustomAmountChange}
              disabled={loading}
              min={MIN_AMOUNT}
              step="100"
              placeholder={`Min ${MIN_AMOUNT.toLocaleString('en-IN')}`}
              className={`w-full pl-8 pr-4 py-3 rounded-lg border ${
                error ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-[#ff5c61] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Selected Amount Display */}
        {(selectedAmount || (customAmount && !error)) && (
          <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100">
            <p className="text-sm text-[#64748b] mb-1">Amount to Recharge</p>
            <p className="text-2xl font-bold text-[#1e293b]">
              {formatCurrency(selectedAmount || parseFloat(customAmount))}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !!error || (!selectedAmount && !customAmount)}
          className="w-full bg-[#ff5c61] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#ff4a50] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            'Confirm Recharge'
          )}
        </button>

        {/* Razorpay Branding */}
        <div className="text-center">
          <p className="text-xs text-[#64748b]">
            🔒 Secured by Razorpay Payments
          </p>
        </div>
      </div>
    </div>
  );
}
