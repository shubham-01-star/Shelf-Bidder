'use client';

/**
 * Wallet Page - Earnings and Transaction History
 * Shows balance, earnings summary, and transaction list
 *
 * Task 8.2: Dashboard and earnings display
 * Requirements: 6.1, 6.2, 6.3
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import { useWallet } from '@/hooks/use-wallet';
import { ArrowLeft, TrendingUp, Package, Building2, Landmark, CheckCircle2, Clock } from 'lucide-react';

export default function WalletPage() {
  const router = useRouter();
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { walletData, isLoading, isError, requestPayout } = useWallet();

  const balance = walletData?.balance || 0;
  // const todayEarnings = walletData?.todayEarnings || 0;
  // const weeklyEarnings = walletData?.weeklyEarnings || 0;
  const transactions = walletData?.transactions || [];

  const handleRequestPayout = async () => {
    try {
      if (payoutAmount <= 0 || payoutAmount > balance) {
        alert('Invalid payout amount. Please enter an amount between ₹1 and ₹' + balance);
        return;
      }
      
      setIsProcessing(true);
      const response = await requestPayout(payoutAmount);
      setShowPayoutModal(false);
      setPayoutAmount(0);
      
      // Show success message
      alert(`✅ Withdrawal Successful!\n\n₹${payoutAmount} has been transferred to your bank account.\n\nBank: State Bank of India •••• 1234\nTransaction ID: ${(response as any)?.data?.transactionId || 'N/A'}`);
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to process withdrawal';
      alert(`❌ Withdrawal Failed\n\n${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative flex h-screen max-w-md mx-auto flex-col bg-background-light dark:bg-background-dark font-sans">
        <div className="flex items-center p-6 pb-4 justify-between">
          <div className="size-10 rounded-full bg-slate-200 animate-pulse"></div>
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mr-10"></div>
        </div>
        <div className="flex-1 px-6 pb-24 space-y-6">
          <div className="h-48 bg-slate-200 rounded-2xl animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-20 bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="h-20 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="relative flex h-screen max-w-md mx-auto flex-col bg-background-light dark:bg-background-dark font-sans">
        <div className="flex items-center p-6 pb-4 justify-between">
           <button onClick={() => router.back()} className="flex size-10 items-center justify-center rounded-full bg-[#11d452]/10 text-[#1a1c1e] active:scale-95 transition-transform">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-[#1a1c1e] text-xl font-bold mr-10">My Wallet</h2>
        </div>
        <div className="flex-1 px-6 flex items-center justify-center">
           <div className="text-center bg-white p-6 rounded-2xl shadow-sm border border-red-100">
             <p className="text-red-500 font-bold">Failed to load wallet data.</p>
             <button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-[#11d452]">Try Again</button>
           </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen max-w-md mx-auto flex-col bg-background-light dark:bg-background-dark text-[#1a1c1e] font-sans antialiased overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-6 pb-4 justify-between z-10">
        <button onClick={() => router.back()} className="flex size-10 items-center justify-center rounded-full bg-[#11d452]/10 text-[#1a1c1e] active:scale-95 transition-transform">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-[#1a1c1e] text-xl font-extrabold flex-1 text-center mr-10 tracking-tight">My Wallet</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-28 pt-2">
        {/* Hero Earnings Card */}
        <div className="mb-8 animate-fadeInUp">
          <div className="flex flex-col items-center justify-center rounded-[1.5rem] p-8 bg-[#11d452] shadow-[0_12px_30px_rgba(17,212,82,0.3)] text-center relative overflow-hidden">
             {/* Decorative background circle */}
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
             
             <p className="text-[#1a1c1e] text-lg font-bold opacity-80 mb-1 z-10">Available Balance</p>
             <h1 className="text-[#1a1c1e] text-5xl font-black tracking-tight my-2 z-10">₹{balance.toLocaleString('en-IN')}</h1>
             
             <div className="mt-4 inline-flex items-center gap-2 bg-white/25 backdrop-blur-sm px-4 py-2 rounded-full z-10 border border-white/20">
                <TrendingUp className="w-4 h-4 text-[#1a1c1e]" />
                <span className="text-[#1a1c1e] text-sm font-bold">Updated Just Now</span>
             </div>
          </div>
        </div>

        {/* Recent Earnings Header */}
        <div className="flex items-center justify-between mb-5 animate-fadeInUp animate-fadeInUp-delay-1">
          <h3 className="text-[#1a1c1e] text-xl font-bold">Recent Earnings</h3>
          <button className="text-[#11d452] font-extrabold text-sm hover:underline">View All</button>
        </div>

        {/* Transactions List */}
        <div className="space-y-4 animate-fadeInUp animate-fadeInUp-delay-2">
           {transactions.length === 0 ? (
             <div className="bg-white p-8 rounded-[1.5rem] shadow-sm border border-slate-100 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">No transactions yet. Complete tasks to earn!</p>
             </div>
           ) : (
             transactions.map((txn, index) => (
               <div key={txn.id} className="flex items-center gap-4 bg-white p-4 rounded-[1.25rem] shadow-sm border border-[#11d452]/5 hover:border-[#11d452]/20 transition-colors"
                   style={{ animationDelay: `${index * 50}ms` }}
               >
                 <div className={`flex items-center justify-center rounded-xl shrink-0 size-14 ${
                    txn.type === 'earning' ? 'bg-[#11d452]/10 text-[#11d452]' : 'bg-red-50 text-red-500'
                 }`}>
                   {txn.type === 'earning' ? (
                     <Package className="w-7 h-7" />
                   ) : (
                     <Landmark className="w-7 h-7" />
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
                     txn.type === 'earning' ? 'text-[#11d452]' : 'text-[#1a1c1e]'
                   }`}>
                     {txn.type === 'earning' ? '+' : '-'}₹{txn.amount}
                   </p>
                 </div>
               </div>
             ))
           )}
        </div>

        {/* Primary Action Button (positioned at bottom of scroll content) */}
        <div className="mt-10 animate-fadeInUp animate-fadeInUp-delay-3 pb-6">
           <button 
             onClick={() => setShowPayoutModal(true)}
             disabled={balance <= 0}
             className="w-full bg-[#11d452] hover:bg-[#11d452]/90 disabled:opacity-50 disabled:active:scale-100 text-[#1a1c1e] text-lg font-black py-4 rounded-[1.25rem] shadow-[0_8px_20px_rgba(17,212,82,0.25)] active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             <Landmark className="w-6 h-6" />
             Withdraw to Bank
           </button>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-t-[2rem] p-6 animate-fadeInUp shadow-2xl relative">
            <div className="w-12 h-1.5 rounded-full mx-auto mb-6 bg-slate-200" />
            
            <h3 className="text-2xl font-black text-[#1a1c1e]">Transfer to Bank</h3>
            <p className="text-sm mt-1 font-semibold text-slate-500">
              Available: <span className="text-[#1a1c1e] font-bold">₹{balance.toLocaleString('en-IN')}</span>
            </p>

            <div className="mt-8 p-4 rounded-2xl bg-background-light dark:bg-background-dark border border-slate-200 focus-within:border-[#11d452] focus-within:ring-2 focus-within:ring-[#11d452]/20 transition-all flex flex-col items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest self-start">
                Amount to withdraw
              </label>
              <div className="flex items-center justify-center w-full mt-2">
                <span className="text-3xl font-bold text-slate-400 mr-1">₹</span>
                <input
                  type="number"
                  value={payoutAmount || ''}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  placeholder={balance.toString()}
                  max={balance}
                  disabled={isProcessing}
                  className="w-full text-5xl font-black bg-transparent border-none outline-none text-[#1a1c1e] placeholder:text-slate-300 text-left p-0 focus:ring-0 disabled:opacity-50"
                  autoFocus
                />
              </div>
              <div className="w-full flex justify-between mt-4 border-t border-slate-200 pt-3">
                 <button 
                   onClick={() => setPayoutAmount(balance)} 
                   disabled={isProcessing}
                   className="text-xs font-bold text-[#11d452] bg-[#11d452]/10 px-3 py-1.5 rounded-lg active:bg-[#11d452]/20 transition-colors disabled:opacity-50"
                 >
                   Max Fill
                 </button>
                 <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Landmark className="w-3.5 h-3.5"/> State Bank of India •••• 1234</span>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                className="flex-1 bg-slate-100 text-[#1a1c1e] hover:bg-slate-200 font-bold py-4 rounded-2xl transition-colors disabled:opacity-50"
                onClick={() => setShowPayoutModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="flex-[2] bg-text-main dark:bg-[#1a1c1e] text-white font-bold py-4 rounded-2xl shadow-xl shadow-black/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                onClick={handleRequestPayout}
                disabled={isProcessing || payoutAmount <= 0 || payoutAmount > balance}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  'Confirm Transfer'
                )}
              </button>
            </div>

            <p className="text-xs text-center mt-6 font-medium text-slate-400">
              Secured by <span className="font-bold text-slate-500">Shelf-Bidder Payments</span>
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
