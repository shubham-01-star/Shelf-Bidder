'use client';

/**
 * Brand Wallet Page - Recharge and Transaction History
 * Shows balance, recharge options, and transaction list
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, CreditCard, Wallet, CheckCircle2, Clock } from 'lucide-react';

export default function BrandWalletPage() {
  const router = useRouter();
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState(85000); // Mock balance
  const [transactions, setTransactions] = useState([
    {
      id: 'txn-001',
      type: 'recharge',
      amount: 50000,
      description: 'Wallet Recharge - Card Payment',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
    },
    {
      id: 'txn-002',
      type: 'campaign',
      amount: -15000,
      description: 'Campaign: Pepsi 500ml - Metro Stores',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed',
    },
  ]);

  const handleRecharge = async () => {
    try {
      if (rechargeAmount < 1000) {
        alert('Minimum recharge amount is ₹1,000');
        return;
      }

      setIsProcessing(true);

      // Call recharge API
      const response = await fetch('/api/brand/wallet/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: rechargeAmount,
          brandId: 'brand-demo-001',
          paymentMethod: 'card',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update balance
        setBalance(prev => prev + rechargeAmount);
        
        // Add transaction to history
        setTransactions(prev => [{
          id: result.data.transactionId,
          type: 'recharge',
          amount: rechargeAmount,
          description: `Wallet Recharge - ${result.data.paymentMethod.toUpperCase()}`,
          timestamp: result.data.timestamp,
          status: 'completed',
        }, ...prev]);

        setShowRechargeModal(false);
        setRechargeAmount(0);
        
        alert(`✅ Recharge Successful!\n\n₹${rechargeAmount} has been added to your wallet.\n\nTransaction ID: ${result.data.transactionId}`);
      } else {
        alert(`❌ Recharge Failed\n\n${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Recharge error:', error);
      alert(`❌ Recharge Failed\n\n${error.message || 'Network error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

  return (
    <div className="relative flex h-screen max-w-md mx-auto flex-col bg-background-light dark:bg-background-dark text-[#1a1c1e] font-sans antialiased overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-6 pb-4 justify-between z-10">
        <button onClick={() => router.back()} className="flex size-10 items-center justify-center rounded-full bg-[#11d452]/10 text-[#1a1c1e] active:scale-95 transition-transform">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-[#1a1c1e] text-xl font-extrabold flex-1 text-center mr-10 tracking-tight">Brand Wallet</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-28 pt-2">
        {/* Balance Card */}
        <div className="mb-8 animate-fadeInUp">
          <div className="flex flex-col items-center justify-center rounded-[1.5rem] p-8 bg-gradient-to-br from-purple-600 to-blue-600 shadow-[0_12px_30px_rgba(139,92,246,0.3)] text-center relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
             
             <p className="text-white text-lg font-bold opacity-90 mb-1 z-10">Available Balance</p>
             <h1 className="text-white text-5xl font-black tracking-tight my-2 z-10">₹{balance.toLocaleString('en-IN')}</h1>
             
             <div className="mt-4 inline-flex items-center gap-2 bg-white/25 backdrop-blur-sm px-4 py-2 rounded-full z-10 border border-white/20">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-bold">Ready for Campaigns</span>
             </div>
          </div>
        </div>

        {/* Recharge Button */}
        <div className="mb-8 animate-fadeInUp animate-fadeInUp-delay-1">
          <button 
            onClick={() => setShowRechargeModal(true)}
            className="w-full bg-[#11d452] hover:bg-[#11d452]/90 text-[#1a1c1e] text-lg font-black py-4 rounded-[1.25rem] shadow-[0_8px_20px_rgba(17,212,82,0.25)] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Wallet className="w-6 h-6" />
            Recharge Wallet
          </button>
        </div>

        {/* Transaction History */}
        <div className="flex items-center justify-between mb-5 animate-fadeInUp animate-fadeInUp-delay-2">
          <h3 className="text-[#1a1c1e] text-xl font-bold">Transaction History</h3>
        </div>

        <div className="space-y-4 animate-fadeInUp animate-fadeInUp-delay-3">
          {transactions.map((txn, index) => (
            <div key={txn.id} className="flex items-center gap-4 bg-white p-4 rounded-[1.25rem] shadow-sm border border-slate-100 hover:border-[#11d452]/20 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`flex items-center justify-center rounded-xl shrink-0 size-14 ${
                 txn.type === 'recharge' ? 'bg-[#11d452]/10 text-[#11d452]' : 'bg-purple-50 text-purple-600'
              }`}>
                {txn.type === 'recharge' ? (
                  <CreditCard className="w-7 h-7" />
                ) : (
                  <Wallet className="w-7 h-7" />
                )}
              </div>
              
              <div className="flex flex-1 flex-col justify-center">
                <p className="text-[#1a1c1e] text-base font-bold leading-tight line-clamp-1">{txn.description}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {txn.status === 'pending' ? (
                     <Clock className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                     <CheckCircle2 className="w-3.5 h-3.5 text-[#11d452]" />
                  )}
                  <p className="text-slate-500 text-xs font-semibold">
                    {new Intl.DateTimeFormat('en-IN', { 
                      month: 'short', day: 'numeric', 
                      hour: 'numeric', minute: '2-digit' 
                    }).format(new Date(txn.timestamp))}
                  </p>
                </div>
              </div>
              
              <div className="shrink-0 text-right">
                <p className={`text-lg font-black ${
                  txn.amount > 0 ? 'text-[#11d452]' : 'text-purple-600'
                }`}>
                  {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-t-[2rem] p-6 animate-fadeInUp shadow-2xl relative">
            <div className="w-12 h-1.5 rounded-full mx-auto mb-6 bg-slate-200" />
            
            <h3 className="text-2xl font-black text-[#1a1c1e]">Recharge Wallet</h3>
            <p className="text-sm mt-1 font-semibold text-slate-500">
              Current Balance: <span className="text-[#1a1c1e] font-bold">₹{balance.toLocaleString('en-IN')}</span>
            </p>

            {/* Quick Amount Buttons */}
            <div className="mt-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Select</p>
              <div className="grid grid-cols-3 gap-3">
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setRechargeAmount(amount)}
                    disabled={isProcessing}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      rechargeAmount === amount
                        ? 'bg-[#11d452] text-[#1a1c1e] shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    } disabled:opacity-50`}
                  >
                    ₹{(amount / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="mt-6 p-4 rounded-2xl bg-background-light dark:bg-background-dark border border-slate-200 focus-within:border-[#11d452] focus-within:ring-2 focus-within:ring-[#11d452]/20 transition-all flex flex-col items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest self-start">
                Custom Amount
              </label>
              <div className="flex items-center justify-center w-full mt-2">
                <span className="text-3xl font-bold text-slate-400 mr-1">₹</span>
                <input
                  type="number"
                  value={rechargeAmount || ''}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  min={1000}
                  disabled={isProcessing}
                  className="w-full text-5xl font-black bg-transparent border-none outline-none text-[#1a1c1e] placeholder:text-slate-300 text-left p-0 focus:ring-0 disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 self-start">Minimum: ₹1,000</p>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                className="flex-1 bg-slate-100 text-[#1a1c1e] hover:bg-slate-200 font-bold py-4 rounded-2xl transition-colors disabled:opacity-50"
                onClick={() => setShowRechargeModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-500/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                onClick={handleRecharge}
                disabled={isProcessing || rechargeAmount < 1000}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Recharge ₹{rechargeAmount.toLocaleString('en-IN')}
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-center mt-6 font-medium text-slate-400">
              Secured by <span className="font-bold text-slate-500">Razorpay Payments</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
