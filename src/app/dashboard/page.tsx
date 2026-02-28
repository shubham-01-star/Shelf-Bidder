'use client';

/**
 * Dashboard Page - Main landing page after login
 * Shows earnings overview, daily status, and quick actions
 *
 * Task 8.2: Dashboard and earnings display
 * Requirements: 6.1, 6.2, 6.3
 */

import { useState, useEffect } from 'react';
import BottomNav from '@/components/navigation/BottomNav';

// Mock data for UI (will be replaced with API calls)
interface DashboardData {
  todayEarnings: number;
  weeklyEarnings: number;
  totalBalance: number;
  activeTasks: number;
  completedToday: number;
  pendingAuctions: number;
}

const mockData: DashboardData = {
  todayEarnings: 350,
  weeklyEarnings: 2450,
  totalBalance: 4800,
  activeTasks: 2,
  completedToday: 3,
  pendingAuctions: 1,
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Determine greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Simulate loading
    const timer = setTimeout(() => setData(mockData), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!data) {
    return (
      <div className="page-container gradient-mesh p-4">
        <div className="space-y-4 pt-12">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-40 w-full" style={{ borderRadius: 'var(--radius-lg)' }} />
          <div className="flex gap-3">
            <div className="skeleton h-24 flex-1" style={{ borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton h-24 flex-1" style={{ borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-container gradient-mesh">
      {/* Header */}
      <header className="p-4 pt-12 pb-2">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {greeting} 👋
        </p>
        <h1 className="text-2xl font-bold mt-1">Ramesh</h1>
      </header>

      {/* Balance Card */}
      <section className="px-4 py-3 animate-fadeInUp" id="balance-card">
        <div className="gradient-primary rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
               style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <p className="text-sm opacity-80 font-medium">Total Balance</p>
          <p className="text-4xl font-extrabold mt-2">₹{data.totalBalance.toLocaleString()}</p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs opacity-70">Today</p>
              <p className="text-lg font-bold">₹{data.todayEarnings}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">This Week</p>
              <p className="text-lg font-bold">₹{data.weeklyEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 py-3 animate-fadeInUp animate-fadeInUp-delay-1">
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            id="btn-scan-shelf"
            className="glass-card p-4 text-left"
            onClick={() => window.location.href = '/camera'}
          >
            <span className="text-2xl">📷</span>
            <p className="text-sm font-semibold mt-2">Scan Shelf</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Start earning now
            </p>
          </button>
          <button
            id="btn-view-tasks"
            className="glass-card p-4 text-left"
            onClick={() => window.location.href = '/tasks'}
          >
            <span className="text-2xl">📋</span>
            <p className="text-sm font-semibold mt-2">Active Tasks</p>
            <p className="text-xs mt-1" style={{ color: 'var(--accent-yellow)' }}>
              {data.activeTasks} pending
            </p>
          </button>
        </div>
      </section>

      {/* Today's Activity */}
      <section className="px-4 py-3 animate-fadeInUp animate-fadeInUp-delay-2">
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Today&apos;s Activity
        </h2>
        <div className="space-y-3">
          <div className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                   style={{ background: 'rgba(0, 214, 143, 0.15)' }}>
                ✅
              </div>
              <div>
                <p className="text-sm font-semibold">Tasks Completed</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Keep it up!</p>
              </div>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--accent-green)' }}>
              {data.completedToday}
            </span>
          </div>

          <div className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                   style={{ background: 'rgba(108, 99, 255, 0.15)' }}>
                🔄
              </div>
              <div>
                <p className="text-sm font-semibold">Active Auctions</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Brands bidding</p>
              </div>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--primary-light)' }}>
              {data.pendingAuctions}
            </span>
          </div>

          <div className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                   style={{ background: 'rgba(255, 170, 0, 0.15)' }}>
                ⏳
              </div>
              <div>
                <p className="text-sm font-semibold">Pending Tasks</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Complete to earn</p>
              </div>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--accent-yellow)' }}>
              {data.activeTasks}
            </span>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
