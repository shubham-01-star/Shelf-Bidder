'use client';

import { useState, useEffect } from 'react';
import { fetchDashboardMetrics } from '@/lib/api';
import ErrorBoundary from '@/components/brand/ErrorBoundary';
import Link from 'next/link';

interface DashboardData {
  activeCampaigns: number;
  totalSpent: number;
  auctionsWon: number;
  walletBalance: number;
  escrowedFunds: number;
}

export default function BrandDashboardRedesignPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardMetrics();
        setDashboardData({
          activeCampaigns: data.activeCampaigns || 0,
          totalSpent: data.totalSpent || 0,
          auctionsWon: data.auctionsWon || 0,
          walletBalance: data.walletBalance || 0,
          escrowedFunds: data.escrowedFunds || 0,
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setDashboardData({
          activeCampaigns: 0,
          totalSpent: 0,
          auctionsWon: 0,
          walletBalance: 0,
          escrowedFunds: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[max(884px,100dvh)] bg-background-light dark:bg-background-dark font-display flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-[max(884px,100dvh)] bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased relative">
        {/* Top Navigation / Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Shelf-Bidder</h1>
                <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">Brand Command Center</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">notifications</span>
              </button>
              <div 
                className="size-10 rounded-xl bg-cover bg-center" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBgpRxsnTJlDpHB8dwXi_8s-O6dWRlfs-F4hGt9Aipf8pw4xm0nLi74QeEBI0a-hpYzspIbqJ19Jer7wmwV4XcbeothSrqHhEL1JMhH_59iUE9T6AuE5vAkVMvQowY3zoQHXCKdtPwUqIAVBemKFskPOnUpvPfgEwfAEJMpbZ91OP33HYxLPDQWU7yrj4vA9e2jhkOQAvJDcXj2tmu8OesvbcsiSGSW9M3TPzayL4pAw_mPdLlXBuoKrChsfiPaTmHubY3sLB9hogw')" }}
              ></div>
            </div>
          </div>
        </header>

        <main className="pb-24">
          {/* 1) Top Metrics */}
          <section className="p-4 grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Active Campaigns</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-2xl font-bold">{dashboardData?.activeCampaigns || 2}</p>
                <span className="material-symbols-outlined text-primary text-sm">campaign</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Total Spent</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-2xl font-bold">₹{dashboardData?.totalSpent.toLocaleString() || '1,500'}</p>
                <span className="material-symbols-outlined text-accent-red text-sm">payments</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Auctions Won</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-2xl font-bold">{dashboardData?.auctionsWon || 5}</p>
                <span className="material-symbols-outlined text-accent-teal text-sm">trophy</span>
              </div>
            </div>
            <div className="bg-primary p-4 rounded-xl shadow-lg shadow-primary/20">
              <p className="text-white/80 text-xs font-medium">Wallet Balance</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-2xl font-bold text-white">₹{dashboardData?.walletBalance.toLocaleString() || '45,200'}</p>
                <span className="material-symbols-outlined text-white text-sm">account_balance_wallet</span>
              </div>
            </div>
          </section>

          {/* 2) The Live Battlefield */}
          <section className="px-4 py-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">The Live Battlefield</h2>
              <span className="flex items-center gap-1 text-[10px] font-bold text-accent-red animate-pulse">
                <span className="size-2 bg-accent-red rounded-full"></span> LIVE
              </span>
            </div>
            <div className="space-y-3">
              {/* Auction Card 1 */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-sm">Premium Eye-Level Shelf</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span> HSR Layout, Bangalore
                    </p>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">4m 20s left</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Base Price</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300">₹450</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Highest Bid</p>
                    <p className="font-bold text-primary">₹620</p>
                  </div>
                </div>
                <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg text-sm transition-all shadow-md shadow-primary/10">
                  Bid Now
                </button>
              </div>

              {/* Auction Card 2 */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-sm">Counter-Top Display</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span> Koramangala, Bangalore
                    </p>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">12m 15s left</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Base Price</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300">₹200</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Highest Bid</p>
                    <p className="font-bold text-primary">₹310</p>
                  </div>
                </div>
                <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg text-sm transition-all shadow-md shadow-primary/10">
                  Bid Now
                </button>
              </div>
            </div>
          </section>

          {/* 3) The Bank */}
          <section className="px-4 py-6">
            <div className="bg-slate-900 dark:bg-primary/10 rounded-2xl p-6 text-white mb-6 overflow-hidden relative">
              <div className="relative z-10">
                <h2 className="text-xl font-bold mb-1">The Bank</h2>
                <p className="text-slate-400 text-xs mb-6">Manage your credits and payments</p>
                <Link href="/brand/wallet">
                  <button className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                    <span className="material-symbols-outlined">add_card</span>
                    Recharge Wallet
                  </button>
                </Link>
              </div>
              {/* Abstract decoration */}
              <div className="absolute -right-10 -bottom-10 size-40 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="absolute -left-10 -top-10 size-40 bg-accent-teal/20 rounded-full blur-3xl"></div>
            </div>
            
            <h3 className="font-bold text-sm mb-3 px-1">Recent Transactions</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-accent-red/10 flex items-center justify-center text-accent-red">
                    <span className="material-symbols-outlined text-sm">gavel</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">Auction Won: Counter-Top</p>
                    <p className="text-[10px] text-slate-400">Oct 24, 2:45 PM</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-accent-red">-₹310</p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-accent-teal/10 flex items-center justify-center text-accent-teal">
                    <span className="material-symbols-outlined text-sm">account_balance</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">Wallet Recharge</p>
                    <p className="text-[10px] text-slate-400">Oct 23, 11:20 AM</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-accent-teal">+₹10,000</p>
              </div>
            </div>
          </section>

          {/* 4) The Proof Gallery */}
          <section className="px-4 py-4">
            <h2 className="text-xl font-bold mb-1">Retail Execution</h2>
            <p className="text-slate-500 text-xs mb-4">Verified Proofs from Shopkeepers</p>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {/* Proof Card 1 */}
              <div className="min-w-[240px] w-[240px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm flex-shrink-0">
                <div 
                  className="relative h-40 bg-cover bg-center" 
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCkODiq9zFAqo0fskkcmXbE7vB3p4tpD6Qf9X89rn3WMXxugyI4hshtSfNB7FWmHxSKo9d2PP6qKVEhnQGDC__tQO9sfnWTQpdesDnsYORNIPrf3RqggVib3e_6tQ54upyXed0QcMqHSHvq13_6Db1Q03GTNXc_krVtocz3sUOzKRUWpv_abDDwD2YRkcZA5-XJtGnb6WQavB-BqW5vmr0ITDvg_zoxo6kfK8MhFFkb5XhWoIOAVnkYarCV1-ysQw8qxezkDMjsRj0')" }}
                >
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <span className="material-symbols-outlined text-[12px]">verified</span> Verified by AI
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold">Coke 500ml - Front Row</h4>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">store</span> Ramesh Kirana, Indiranagar
                  </p>
                </div>
              </div>

              {/* Proof Card 2 */}
              <div className="min-w-[240px] w-[240px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm flex-shrink-0">
                <div 
                  className="relative h-40 bg-cover bg-center" 
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCXhwFNmP7kfsHrk0YXIkU1fzFCY4jwlBHrP112bfbrpzmiXy90RZhamkfBe20V9f1IyRNGMKxCrdlEKQEI5qrVjBJmo8IEg0numuuynzOzg_ldmblCM131WqoIIHbAMlHX_FwCgtDBoytl3jl7ef_HRHIWys6KYarudX2a_qT_NXgxRuKp0GHPOTdh3iU_VrHgn3JCyiRECqjokGJ6oHqE0AQMPJzMRZrDmkTTGnreXG7D0JCEx7p94JQzGZ-3jVUc5_V2V1Mkb44')" }}
                >
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <span className="material-symbols-outlined text-[12px]">verified</span> Verified by AI
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold">Lay's Classic - Eye Level</h4>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">store</span> City Mart, Jayanagar
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* 5) Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 pb-6 pt-2 z-50">
          <div className="flex justify-around items-center">
            <Link className="flex flex-col items-center gap-1 text-primary" href="/brand/dashboard-redesign">
              <span className="material-symbols-outlined text-[24px]">dashboard</span>
              <span className="text-[10px] font-bold">Dash</span>
            </Link>
            <Link className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors" href="/brand/products">
              <span className="material-symbols-outlined text-[24px]">package_2</span>
              <span className="text-[10px] font-medium">Products</span>
            </Link>
            <Link className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors" href="/brand/campaigns">
              <span className="material-symbols-outlined text-[24px]">ads_click</span>
              <span className="text-[10px] font-medium">Campaigns</span>
            </Link>
            <Link className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors" href="/brand/auctions">
              <span className="material-symbols-outlined text-[24px]">gavel</span>
              <span className="text-[10px] font-medium">Auctions</span>
            </Link>
            <Link className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors" href="/brand/wallet">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
              <span className="text-[10px] font-medium">Wallet</span>
            </Link>
          </div>
        </nav>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </ErrorBoundary>
  );
}
