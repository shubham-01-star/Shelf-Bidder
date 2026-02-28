'use client';

/**
 * Brand Dashboard Page
 * Shows spending overview, active bids, auction results
 */

import { useState, useEffect } from 'react';
import type { BrandDashboardData, BrandBid } from '@/types/brand-models';

// Mock data for prototype
const MOCK_DASHBOARD: BrandDashboardData = {
  totalSpent: 12450,
  activeBids: 3,
  auctionsWon: 28,
  auctionsLost: 15,
  monthlySpend: 4200,
  recentBids: [
    { id: 'bid-1', auctionId: 'auc-101', productId: 'p1', productName: 'Pepsi 500ml', amount: 95, status: 'won', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'bid-2', auctionId: 'auc-102', productId: 'p2', productName: 'Lays Classic', amount: 75, status: 'pending', timestamp: new Date(Date.now() - 1800000).toISOString() },
    { id: 'bid-3', auctionId: 'auc-103', productId: 'p1', productName: 'Pepsi 500ml', amount: 120, status: 'lost', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'bid-4', auctionId: 'auc-104', productId: 'p3', productName: 'Pepsi Diet 330ml', amount: 60, status: 'won', timestamp: new Date(Date.now() - 86400000).toISOString() },
  ],
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  won: { color: 'var(--accent-green)', bg: 'rgba(0, 214, 143, 0.15)', label: '🏆 Won' },
  lost: { color: 'var(--accent)', bg: 'rgba(255, 107, 107, 0.15)', label: '❌ Lost' },
  pending: { color: 'var(--accent-yellow)', bg: 'rgba(255, 170, 0, 0.15)', label: '⏳ Active' },
  rejected: { color: 'var(--text-muted)', bg: 'rgba(107, 114, 128, 0.15)', label: '🚫 Rejected' },
};

export default function BrandDashboardPage() {
  const [data] = useState<BrandDashboardData>(MOCK_DASHBOARD);
  const [brandName, setBrandName] = useState('Brand');

  useEffect(() => {
    const name = localStorage.getItem('brandName');
    if (name) setBrandName(name);
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  return (
    <div className="page-container gradient-mesh">
      {/* Header */}
      <header className="p-4 pt-12 pb-2">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{greeting} 👋</p>
        <h1 className="text-2xl font-bold mt-1">{brandName}</h1>
        <span className="badge badge-info mt-2">Brand Portal</span>
      </header>

      {/* Spending Overview */}
      <section className="px-4 py-3 animate-fadeInUp" id="spending-card">
        <div className="rounded-2xl p-5 relative overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
               style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <p className="text-sm opacity-80 font-medium">Total Ad Spend</p>
          <p className="text-4xl font-extrabold mt-2">₹{data.totalSpent.toLocaleString()}</p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs opacity-70">This Month</p>
              <p className="text-lg font-bold">₹{data.monthlySpend.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Active Bids</p>
              <p className="text-lg font-bold">{data.activeBids}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="px-4 py-3 animate-fadeInUp animate-fadeInUp-delay-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>{data.auctionsWon}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Auctions Won</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{data.auctionsLost}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Auctions Lost</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 py-3 animate-fadeInUp animate-fadeInUp-delay-1">
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="glass-card p-4 text-left" onClick={() => window.location.href = '/brand/auctions'}>
            <span className="text-2xl">🏷️</span>
            <p className="text-sm font-semibold mt-2">View Auctions</p>
            <p className="text-xs mt-1" style={{ color: 'var(--accent-yellow)' }}>{data.activeBids} active</p>
          </button>
          <button className="glass-card p-4 text-left" onClick={() => window.location.href = '/brand/products'}>
            <span className="text-2xl">📦</span>
            <p className="text-sm font-semibold mt-2">My Products</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Manage catalog</p>
          </button>
        </div>
      </section>

      {/* Recent Bids */}
      <section className="px-4 py-3 animate-fadeInUp animate-fadeInUp-delay-2">
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Recent Bids</h2>
        <div className="space-y-3">
          {data.recentBids.map((bid: BrandBid) => {
            const status = statusConfig[bid.status];
            return (
              <div key={bid.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: status.bg }}>
                    🏷️
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{bid.productName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(bid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">₹{bid.amount}</p>
                  <span className="badge text-xs" style={{ background: status.bg, color: status.color }}>
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
