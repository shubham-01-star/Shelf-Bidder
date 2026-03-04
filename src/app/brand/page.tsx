'use client';

/**
 * Brand Dashboard Page
 * Shows spending overview, active bids, auction results
 */

import { useState, useEffect } from 'react';
import type { BrandDashboardData, BrandBid } from '@/types/brand-models';

// Removed static mock data

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  won: { color: 'var(--accent-green)', bg: 'rgba(0, 214, 143, 0.15)', label: '🏆 Won' },
  lost: { color: 'var(--accent)', bg: 'rgba(255, 107, 107, 0.15)', label: '❌ Lost' },
  pending: { color: 'var(--accent-yellow)', bg: 'rgba(255, 170, 0, 0.15)', label: '⏳ Active' },
  rejected: { color: 'var(--text-muted)', bg: 'rgba(107, 114, 128, 0.15)', label: '🚫 Rejected' },
};

export default function BrandDashboardPage() {
  const [data, setData] = useState<BrandDashboardData | null>(null);
  const [brandName, setBrandName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('brandName') || 'Brand';
    }
    return 'Brand';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const brandId = localStorage.getItem('brandId');

    if (brandId) {
      fetch('/api/brand/dashboard', {
        headers: { 'x-brand-id': brandId }
      })
        .then(res => res.json())
        .then(resData => {
          if (resData.success && resData.data) {
            setData(resData.data);
          }
        })
        .catch(err => console.error('Failed to fetch brand dashboard', err))
        .finally(() => setLoading(false));
    } else {
      // Redirect if not logged in
      window.location.href = '/brand/login';
    }
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  if (loading || !data) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#0a0510] text-white">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <p className="font-bold tracking-widest uppercase text-sm text-[var(--brand-violet)] animate-pulse">Loading Workspace</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square rounded-full bg-[var(--brand-violet)]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="p-4 pt-12 pb-2 relative z-10">
        <p className="text-sm font-medium text-slate-400">{greeting} 👋</p>
        <h1 className="text-2xl font-black mt-1 text-white/90 tracking-tight">{brandName}</h1>
        <span className="inline-block mt-3 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[var(--brand-violet)]/20 text-[var(--brand-violet)] border border-[var(--brand-violet)]/30">
          Brand Portal
        </span>
      </header>

      {/* Spending Overview */}
      <section className="px-4 py-3 animate-fadeInUp relative z-10" id="spending-card">
        <div className="rounded-3xl p-6 relative overflow-hidden shadow-2xl shadow-[var(--brand-violet)]/20 border border-white/10"
             style={{ background: 'linear-gradient(135deg, var(--brand-violet) 0%, #4c1d95 100%)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
               style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <p className="text-sm font-bold text-white/70 uppercase tracking-widest">Total Ad Spend</p>
          <p className="text-4xl font-black mt-2 text-white">₹{data.totalSpent.toLocaleString()}</p>
          <div className="flex gap-8 mt-6">
            <div>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">This Month</p>
              <p className="text-lg font-bold text-white">₹{data.monthlySpend.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Active Bids</p>
              <p className="text-lg font-bold text-white">{data.activeBids}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="px-4 py-3 animate-fadeInUp animate-fadeInUp-delay-1 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl text-center shadow-lg hover:bg-slate-800/60 transition-colors cursor-default">
            <p className="text-3xl font-black text-[var(--accent-green)]">{data.auctionsWon}</p>
            <p className="text-[10px] font-bold mt-2 text-slate-400 uppercase tracking-widest">Auctions Won</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl text-center shadow-lg hover:bg-slate-800/60 transition-colors cursor-default">
            <p className="text-3xl font-black text-red-500">{data.auctionsLost}</p>
            <p className="text-[10px] font-bold mt-2 text-slate-400 uppercase tracking-widest">Auctions Lost</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 py-3 animate-fadeInUp animate-fadeInUp-delay-1 relative z-10">
        <h2 className="text-base font-bold mb-3 text-slate-300">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl text-left shadow-lg hover:bg-slate-800/80 hover:border-slate-700 transition-all group" onClick={() => window.location.href = '/brand/auctions'}>
            <span className="text-3xl group-hover:scale-110 transition-transform block">🏷️</span>
            <p className="text-sm font-bold mt-3 text-white/90 group-hover:text-white">View Auctions</p>
            <p className="text-[10px] font-bold mt-1 text-[var(--brand-violet)] uppercase tracking-widest">{data.activeBids} active</p>
          </button>
          <button className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl text-left shadow-lg hover:bg-slate-800/80 hover:border-slate-700 transition-all group" onClick={() => window.location.href = '/brand/products'}>
            <span className="text-3xl group-hover:scale-110 transition-transform block">📦</span>
            <p className="text-sm font-bold mt-3 text-white/90 group-hover:text-white">My Products</p>
            <p className="text-[10px] font-bold mt-1 text-slate-500 uppercase tracking-widest">Manage catalog</p>
          </button>
        </div>
      </section>

      {/* Recent Bids */}
      <section className="px-4 py-3 animate-fadeInUp animate-fadeInUp-delay-2 relative z-10 pb-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-slate-300">Recent Bids</h2>
          <button className="text-[10px] font-bold text-[var(--brand-violet)] uppercase tracking-widest hover:text-purple-400" onClick={() => window.location.href = '/brand/auctions'}>View All</button>
        </div>
        <div className="space-y-3">
          {data.recentBids.map((bid: BrandBid) => {
            const status = statusConfig[bid.status];
            // Override styles for dark theme
            const statusStyles = {
              won: { bg: 'bg-green-500/10', text: 'text-[var(--accent-green)]', border: 'border-green-500/20' },
              lost: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
              pending: { bg: 'bg-[var(--brand-violet)]/10', text: 'text-[var(--brand-violet)]', border: 'border-[var(--brand-violet)]/20' },
              rejected: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' }
            }[bid.status] || { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' };

            return (
              <div key={bid.id} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl flex items-center justify-between hover:bg-slate-800/60 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${statusStyles.bg} ${statusStyles.border} border`}>
                    🏷️
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/90">{bid.productName}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                      {new Date(bid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">₹{bid.amount}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-md ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border} border`}>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
