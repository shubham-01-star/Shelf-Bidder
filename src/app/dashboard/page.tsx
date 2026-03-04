'use client';

import { useState } from 'react';
import BottomNav from '@/components/navigation/BottomNav';
import { useDashboard } from '@/hooks/use-dashboard';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { Camera, ClipboardList, CheckCircle2, Gavel, Clock, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const { data, isLoading, isError, mutate } = useDashboard();
  const { shopkeeper } = useAuth();
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  });
  const router = useRouter();

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex flex-col p-6 pt-12">
        <div className="space-y-6">
          <div className="skeleton h-12 w-48 rounded-lg" />
          <div className="skeleton h-48 w-full rounded-[1.25rem]" />
          <div className="grid grid-cols-2 gap-4">
            <div className="skeleton h-32 w-full rounded-[1.25rem]" />
            <div className="skeleton h-32 w-full rounded-[1.25rem]" />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#f8faf9] p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-bold mb-4">Failed to load dashboard data</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#11d452] text-white rounded-xl font-bold font-sans">Retry</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f8faf9] text-slate-900 pb-20">
      
      {/* Header */}
      <header className="p-6 pt-12 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">{greeting} 👋</h1>
          <p className="text-2xl font-bold text-[#11d452]">{shopkeeper?.name || 'Ramesh ji'}</p>
        </div>
        <button 
          onClick={() => mutate()}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#11d452]/10 text-[#11d452] active:scale-95 transition-transform"
        >
          <RefreshCw className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </header>

      <main className="flex-1 px-6 space-y-8 animate-fadeInUp">
        
        {/* Balance Card */}
        <div className="bg-[#11d452] rounded-[1.25rem] p-6 shadow-xl shadow-[#11d452]/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/80 font-medium text-lg">Total Balance</p>
            <h2 className="text-white text-5xl font-bold mt-1 tracking-tight">₹{data.totalBalance.toLocaleString()}</h2>
            <div className="mt-8 flex items-center justify-between">
              <p className="text-white/90 font-medium">Ready to withdraw</p>
              <button 
                onClick={() => router.push('/wallet')}
                className="bg-white text-[#11d452] px-6 py-2.5 rounded-xl font-bold text-lg shadow-sm active:bg-slate-50 transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-black/5 rounded-full"></div>
        </div>

        {/* Quick Actions */}
        <section>
          <h3 className="text-xl font-bold mb-4 px-1 text-slate-700">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/camera')}
              className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-[1.25rem] border-2 border-slate-50 shadow-sm active:bg-[#11d452]/5 active:border-[#11d452] transition-all group"
            >
              <div className="w-16 h-16 bg-[#11d452]/10 text-[#11d452] rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
                <Camera className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-slate-800 block">Scan Shelf</span>
                <span className="text-xs font-semibold text-slate-400">Start earning</span>
              </div>
            </button>
            <button 
              onClick={() => router.push('/tasks')}
              className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-[1.25rem] border-2 border-slate-50 shadow-sm active:bg-[#11d452]/5 active:border-[#11d452] transition-all group"
            >
              <div className="w-16 h-16 bg-[#11d452]/10 text-[#11d452] rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
                <ClipboardList className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-slate-800 block">Active Tasks</span>
                <span className="text-xs font-semibold text-orange-500">{data.activeTasks} pending</span>
              </div>
            </button>
          </div>
        </section>

        {/* Today's Activity */}
        <section className="pb-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xl font-bold text-slate-700">Today&apos;s Activity</h3>
            <span className="text-sm font-semibold text-[#11d452] cursor-pointer" onClick={() => router.push('/tasks')}>View All</span>
          </div>
          <div className="space-y-3">
            
            <div className="flex items-center gap-4 bg-white p-4 rounded-[1.25rem] shadow-sm border border-slate-50">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-slate-800">Tasks Completed</p>
                <p className="text-xs font-medium text-slate-400">Keep it up!</p>
              </div>
              <span className="text-xl font-bold text-slate-400">{data.completedToday}</span>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-[1.25rem] shadow-sm border border-slate-50">
              <div className="w-12 h-12 bg-[#11d452]/10 text-[#11d452] rounded-full flex items-center justify-center">
                <Gavel className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-slate-800">Active Auctions</p>
                <p className="text-xs font-medium text-slate-400">Brands bidding</p>
              </div>
              <span className="text-xl font-bold text-slate-400">{data.pendingAuctions}</span>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-[1.25rem] shadow-sm border border-slate-50">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-slate-800">Pending Tasks</p>
                <p className="text-xs font-medium text-slate-400">Complete to earn</p>
              </div>
              <span className="text-xl font-bold text-slate-400">{data.activeTasks}</span>
            </div>

          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
