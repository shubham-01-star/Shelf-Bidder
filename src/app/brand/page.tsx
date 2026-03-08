'use client';

/**
 * Premium Brand Dashboard Page
 * High-end analytics and management interface for brands
 */

import { useState, useEffect } from 'react';


export default function BrandDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [brandName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('brandName') || 'Coca-Cola';
    }
    return 'Coca-Cola';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const brandId = localStorage.getItem('brandId') || 'brand-demo-001';
    const brandToken = localStorage.getItem('brandToken') || 'demo';

    fetch('/api/brand/dashboard', {
      headers: { 
        'x-brand-id': brandId,
        'Authorization': `Bearer ${brandToken}`
      }
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success && resData.data) {
          setData(resData.data);
        }
      })
      .catch(err => console.error('Failed to fetch brand dashboard', err))
      .finally(() => setLoading(false));
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  if (loading || !data) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#0B0F19] text-white">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-primary/50 animate-spin animation-delay-150"></div>
          <span className="material-symbols-outlined text-primary/80 animate-pulse">storefront</span>
        </div>
        <p className="mt-6 font-semibold tracking-widest text-xs text-primary/70 uppercase">Loading Command Center</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19] text-white selection:bg-primary/30 relative overflow-hidden font-sans">
      
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-primary/10 blur-[120px] mix-blend-screen opacity-50 animate-pulse-slow object-cover"></div>
        <div className="absolute top-[40%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-[#3b82f6]/10 blur-[130px] mix-blend-screen opacity-40"></div>
        <div className="absolute -bottom-[20%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[100px] mix-blend-screen opacity-30"></div>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto pb-32">
        
        {/* Top Navigation / Header */}
        <header className="px-6 pt-12 pb-6 flex justify-between items-end backdrop-blur-sm sticky top-0 z-50 bg-[#0B0F19]/80 border-b border-white/[0.02]">
          <div className="animate-fadeInUp">
            <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
              {greeting} <span className="animate-waving-hand inline-block">👋</span>
            </p>
            <h1 className="text-3xl font-bold mt-1 text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {brandName}
            </h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-[#4c1d95] p-[2px] shadow-lg shadow-primary/20 animate-fadeInUp cursor-pointer" onClick={() => window.location.href = '/brand/login'}>
            <div className="w-full h-full rounded-full bg-[#0B0F19] flex items-center justify-center">
               <span className="text-lg font-bold text-primary">{brandName.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        <div className="px-6 space-y-6 mt-4">
          
          {/* Hero Metrics (Glass Effect) */}
          <section className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="relative overflow-hidden rounded-[2rem] p-8 border border-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-[#4c1d95]/30 backdrop-blur-2xl transition-all duration-500 group-hover:opacity-100"></div>
              
              <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xs font-bold text-white/60 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span> Current Balance
                    </h2>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold tracking-tighter">₹</span>
                      <h3 className="text-5xl font-extrabold tracking-tighter">
                        {(data.walletBalance || 0).toLocaleString()}
                      </h3>
                    </div>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/5 shadow-inner" onClick={() => window.location.href = '/brand/wallet'}>
                    <span className="material-symbols-outlined text-white/80">add_card</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Escrowed (Active Bids)</p>
                    <p className="text-xl font-bold tracking-tight">₹{data.remainingBudget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Total Ad Spent</p>
                    <p className="text-xl font-bold tracking-tight">₹{data.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Metrics Grid */}
          <section className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-6 hover:bg-emerald-500/10 transition-all hover:-translate-y-1 hover:shadow-xl shadow-black/50 overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>
               <div className="flex items-center justify-between mb-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                       <span className="material-symbols-outlined">emoji_events</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-emerald-500/70 uppercase tracking-widest">Successful Placements</p>
                      <h3 className="text-3xl font-black text-white">{data.successfulPlacements}</h3>
                    </div>
                  </div>
               </div>
            </div>
          </section>

          {/* Core Actions */}
          <section className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Demand Engine</h2>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => window.location.href = '/brand/campaigns/create'}
                className="flex flex-col bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.08] p-5 rounded-[24px] hover:bg-white/[0.08] transition-all group overflow-hidden relative"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-blue-400">add_circle</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">New Campaign</h3>
                <p className="text-[10px] text-slate-400">Launch Bounty</p>
              </button>
              
              <button 
                onClick={() => window.location.href = '/brand/wallet'}
                className="flex flex-col bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.08] p-5 rounded-[24px] hover:bg-white/[0.08] transition-all group overflow-hidden relative"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-purple-400">account_balance_wallet</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Manage Wallet</h3>
                <p className="text-[10px] text-slate-400">Top Up Escrow</p>
              </button>
            </div>
          </section>

          {/* Activity Feed (Live Feed Gallery Demo) */}
          <section className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
             <div className="flex justify-between items-end mb-4 px-2">
                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Live Feed Gallery</h2>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Live</span>
                </div>
             </div>
             
             <div className="space-y-4">
                {data.recentActivity && data.recentActivity.length > 0 ? data.recentActivity.map((task: any, idx: number) => {
                  return (
                    <div key={task.id} className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden group cursor-pointer hover:bg-white/[0.04] transition-all" style={{ animationDelay: `${0.4 + (idx * 0.1)}s` }}>
                      <div className="h-40 w-full overflow-hidden relative border-b border-white/[0.05]">
                         <img src={task.proof_url} alt="Proof" className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500" />
                         <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-emerald-400 text-[14px]">verified</span>
                            <span className="text-[10px] font-bold text-white">AI Verified</span>
                         </div>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white/90">
                            {task.product_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-medium text-slate-500">
                              {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                           <span className="text-sm font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                              - ₹{task.payout_amount}
                           </span>
                           <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Paid to Store</p>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                   <div className="p-8 text-center bg-white/[0.02] border border-white/[0.05] rounded-3xl">
                     <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.02] flex items-center justify-center mb-4 border border-white/[0.05]">
                        <span className="material-symbols-outlined text-slate-500">photo_camera</span>
                     </div>
                     <p className="text-sm text-slate-400 font-medium">No verifications yet</p>
                     <p className="text-[11px] text-slate-500 mt-1">Start a campaign to receive real-time shelf proofs.</p>
                   </div>
                )}
             </div>
          </section>
        </div>
      </main>
    </div>
  );
}
