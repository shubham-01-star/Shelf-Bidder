'use client';

/**
 * Transaction History Component
 * Feature: brand-dashboard-redesign
 * Task: 12.2 Create transaction history component
 * 
 * Displays wallet transactions in reverse chronological order
 */

import { useEffect, useState } from 'react';
import { fetchTransactions } from '@/lib/api';
import type { Transaction } from '@/types/brand-dashboard';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const brandId = localStorage.getItem('brandId') || 'b1';
        const data = await fetchTransactions(brandId);
        
        // Sort in reverse chronological order
        const sorted = data.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setTransactions(sorted);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'recharge':
        return '↓';
      case 'spend':
        return '↑';
      case 'escrow':
        return '🔒';
      case 'release':
        return '🔓';
      default:
        return '•';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'recharge':
        return 'text-green-600 bg-green-50';
      case 'spend':
        return 'text-red-600 bg-red-50';
      case 'escrow':
        return 'text-yellow-600 bg-yellow-50';
      case 'release':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-xs text-green-600 font-medium">✓ Completed</span>;
      case 'pending':
        return <span className="text-xs text-yellow-600 font-medium">⏳ Pending</span>;
      case 'failed':
        return <span className="text-xs text-red-600 font-medium">✗ Failed</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff5c61]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[#64748b]">
        <p>{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-[#64748b]">
        <p>No transactions yet. Recharge your wallet to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.transactionId}
          className="bg-white rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {/* Transaction Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getTransactionColor(transaction.type)}`}>
                {getTransactionIcon(transaction.type)}
              </div>

              {/* Transaction Details */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-[#1e293b] capitalize">
                    {transaction.type}
                  </p>
                  {getStatusBadge(transaction.status)}
                </div>
                <p className="text-xs text-[#64748b]">
                  {formatDate(transaction.timestamp)}
                </p>
                {transaction.metadata?.paymentMethod && (
                  <p className="text-xs text-[#64748b] mt-1">
                    via {transaction.metadata.paymentMethod}
                  </p>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className={`text-lg font-bold ${
                transaction.type === 'recharge' || transaction.type === 'release'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {transaction.type === 'recharge' || transaction.type === 'release' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
