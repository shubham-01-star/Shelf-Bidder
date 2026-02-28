'use client';

/**
 * Wallet Page - Earnings and Transaction History
 * Shows balance, earnings summary, and transaction list
 *
 * Task 8.2: Dashboard and earnings display
 * Requirements: 6.1, 6.2, 6.3
 */

import { useState } from 'react';
import BottomNav from '@/components/navigation/BottomNav';
import { useWallet } from '@/hooks/use-wallet';

export default function WalletPage() {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const { walletData, isLoading, isError, requestPayout } = useWallet();

  const balance = walletData?.balance || 0;
  const todayEarnings = walletData?.todayEarnings || 0;
  const weeklyEarnings = walletData?.weeklyEarnings || 0;
  const transactions = walletData?.transactions || [];

  const handleRequestPayout = async () => {
    try {
      if (payoutAmount <= 0 || payoutAmount > balance) {
        alert('Invalid payout amount.');
        return;
      }
      await requestPayout(payoutAmount);
      setShowPayoutModal(false);
      alert('Payout requested successfully!');
    } catch (error) {
      alert('Failed to request payout.');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container gradient-mesh p-4 pt-12 space-y-4">
        <h1 className="text-xl font-bold">Wallet</h1>
        <div className="skeleton h-40 w-full rounded-2xl" />
        <div className="flex gap-3">
          <div className="skeleton h-24 flex-1 rounded-2xl" />
          <div className="skeleton h-24 flex-1 rounded-2xl" />
        </div>
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-container gradient-mesh p-4 pt-12 space-y-4 text-center">
        <h1 className="text-xl font-bold text-left">Wallet</h1>
        <div className="glass-card p-8 text-red-400 font-bold">
          Failed to load wallet data.
        </div>
      </div>
    );
  }

  return (
    <div className="page-container gradient-mesh">
      {/* Header */}
      <header className="p-4 pt-12">
        <h1 className="text-xl font-bold">Wallet</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Track your earnings & payouts
        </p>
      </header>

      {/* Balance Card */}
      <section className="px-4 py-2 animate-fadeInUp" id="wallet-balance">
        <div className="gradient-success rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
               style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <p className="text-sm opacity-80 font-medium">Available Balance</p>
          <p className="text-4xl font-extrabold mt-2">₹{balance.toLocaleString()}</p>
          <button
            className="mt-4 px-5 py-2 rounded-full text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
            onClick={() => setShowPayoutModal(true)}
            id="btn-request-payout"
          >
            💸 Request Payout
          </button>
        </div>
      </section>

      {/* Earnings Summary */}
      <section className="px-4 py-3 animate-fadeInUp animate-fadeInUp-delay-1">
        <div className="flex gap-3">
          <div className="glass-card flex-1 p-4 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Today</p>
            <p className="text-xl font-bold mt-1" style={{ color: 'var(--accent-green)' }}>
              ₹{todayEarnings}
            </p>
          </div>
          <div className="glass-card flex-1 p-4 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>This Week</p>
            <p className="text-xl font-bold mt-1" style={{ color: 'var(--primary-light)' }}>
              ₹{weeklyEarnings.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Transaction History */}
      <section className="px-4 py-3 animate-fadeInUp animate-fadeInUp-delay-2" id="transaction-history">
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Recent Transactions
        </h2>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No transactions yet.
            </div>
          ) : (
            transactions.map((txn) => (
              <div key={txn.id} className="glass-card p-4 flex items-center justify-between"
                   id={`txn-${txn.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                       style={{
                         background: txn.type === 'earning'
                           ? 'rgba(0, 214, 143, 0.15)'
                           : 'rgba(255, 107, 107, 0.15)',
                       }}>
                    {txn.type === 'earning' ? '💰' : '💸'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{txn.description}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Intl.DateTimeFormat('en-IN', { 
                        month: 'short', day: 'numeric', 
                        hour: 'numeric', minute: '2-digit' 
                      }).format(new Date(txn.timestamp))}
                      {txn.status === 'pending' && ' (Pending)'}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-sm"
                   style={{ color: txn.type === 'earning' ? 'var(--accent-green)' : 'var(--accent)' }}>
                  {txn.type === 'earning' ? '+' : '-'}₹{txn.amount}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
             style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md glass-card rounded-t-3xl p-6 animate-fadeInUp"
               style={{ background: 'var(--bg-card)' }}
               id="payout-modal">
            <div className="w-10 h-1 rounded-full mx-auto mb-4"
                 style={{ background: 'var(--border)' }} />
            <h3 className="text-lg font-bold">Request Payout</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Available: ₹{balance.toLocaleString()}
            </p>

            <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                Amount (₹)
              </label>
              <input
                type="number"
                value={payoutAmount || ''}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                placeholder={balance.toString()}
                max={balance}
                className="w-full mt-2 text-2xl font-bold bg-transparent outline-none"
                style={{ color: 'var(--text-primary)' }}
                id="payout-amount-input"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                className="btn btn-outline flex-1"
                onClick={() => setShowPayoutModal(false)}
                id="btn-cancel-payout"
              >
                Cancel
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={handleRequestPayout}
                id="btn-confirm-payout"
              >
                Confirm
              </button>
            </div>

            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
              Payout will be processed within 24 hours
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
