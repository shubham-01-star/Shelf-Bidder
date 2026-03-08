'use client';

/**
 * MetricsCardsContainer Component
 * Feature: brand-dashboard-redesign
 * Task: 6.2 Build metrics cards container
 * 
 * Container component that displays 4 metric cards in a responsive grid:
 * - Active Campaigns
 * - Total Spent
 * - Auctions Won
 * - Wallet Balance
 * 
 * Features:
 * - Fetches data from GET /api/brand/dashboard on mount
 * - Updates all cards simultaneously when data loads
 * - Handles API errors with placeholder values and error indication
 * - Responsive grid (1 column mobile, 2x2 desktop)
 * 
 * Requirements: 6.1, 6.2, 6.5, 6.7, 8R.1, 8R.3, 14.1, 14.3
 */

import React, { useEffect, useState } from 'react';
import { MetricsCard } from './MetricsCard';
import { fetchDashboardMetrics } from '@/lib/api';
import type { DashboardMetrics } from '@/types/brand-dashboard';

// Icons for each metric card
const TrendingUpIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const CurrencyIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

interface MetricsCardsContainerProps {
  className?: string;
}

export function MetricsCardsContainer({ className = '' }: MetricsCardsContainerProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const data = await fetchDashboardMetrics();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setMetrics(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
        
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
          
          // Set placeholder values on error
          setMetrics({
            activeCampaigns: 0,
            totalSpent: 0,
            auctionsWon: 0,
            walletBalance: 0,
          });
        }
      }
    }

    loadMetrics();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, []);

  // Placeholder values for loading/error states
  const displayMetrics = metrics || {
    activeCampaigns: 0,
    totalSpent: 0,
    auctionsWon: 0,
    walletBalance: 0,
  };

  return (
    <div className={className}>
      {/* Error indicator banner */}
      {hasError && !isLoading && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              Failed to load dashboard metrics. Showing placeholder values.
            </span>
          </div>
        </div>
      )}

      {/* Responsive grid: 1 column mobile, 2x2 desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Campaigns Card */}
        <MetricsCard
          icon={<TrendingUpIcon />}
          label="Active Campaigns"
          value={displayMetrics.activeCampaigns}
          isLoading={isLoading}
        />

        {/* Total Spent Card */}
        <MetricsCard
          icon={<CurrencyIcon />}
          label="Total Spent"
          value={displayMetrics.totalSpent}
          isLoading={isLoading}
        />

        {/* Auctions Won Card */}
        <MetricsCard
          icon={<TrophyIcon />}
          label="Auctions Won"
          value={displayMetrics.auctionsWon}
          isLoading={isLoading}
        />

        {/* Wallet Balance Card with gradient styling */}
        <MetricsCard
          icon={<WalletIcon />}
          label="Wallet Balance"
          value={displayMetrics.walletBalance}
          isLoading={isLoading}
          isGradient={true}
        />
      </div>
    </div>
  );
}

export default MetricsCardsContainer;
