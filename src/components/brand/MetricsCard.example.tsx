/**
 * MetricsCard Component Usage Examples
 * Feature: brand-dashboard-redesign
 * 
 * This file demonstrates how to use the MetricsCard component
 * in various scenarios.
 */

import React from 'react';
import { MetricsCard } from './MetricsCard';

// Example icons (you can use any icon library like lucide-react, heroicons, etc.)
const CampaignIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const SpendIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Example 1: Basic Metrics Card
 * Standard card with white background and soft shadow
 */
export function BasicMetricsCardExample() {
  return (
    <MetricsCard
      icon={<CampaignIcon />}
      label="Active Campaigns"
      value={5}
    />
  );
}

/**
 * Example 2: Wallet Balance Card with Gradient
 * Special gradient styling (purple-600 to blue-600) for wallet balance
 */
export function WalletBalanceCardExample() {
  return (
    <MetricsCard
      icon={<WalletIcon />}
      label="Wallet Balance"
      value={50000}
      isGradient={true}
    />
  );
}

/**
 * Example 3: Loading State
 * Shows skeleton loader while data is being fetched
 */
export function LoadingMetricsCardExample() {
  return (
    <MetricsCard
      icon={<CampaignIcon />}
      label="Active Campaigns"
      value={0}
      isLoading={true}
    />
  );
}

/**
 * Example 4: String Value (Non-Currency)
 * Display non-numeric values without currency formatting
 */
export function StringValueCardExample() {
  return (
    <MetricsCard
      icon={<TrophyIcon />}
      label="Status"
      value="Active"
    />
  );
}

/**
 * Example 5: Complete Dashboard Metrics Grid
 * Shows all 4 metrics cards in a responsive grid layout
 */
export function DashboardMetricsExample() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [metrics, setMetrics] = React.useState({
    activeCampaigns: 0,
    totalSpent: 0,
    auctionsWon: 0,
    walletBalance: 0,
  });

  // Simulate data fetching
  React.useEffect(() => {
    setTimeout(() => {
      setMetrics({
        activeCampaigns: 5,
        totalSpent: 125000,
        auctionsWon: 12,
        walletBalance: 50000,
      });
      setIsLoading(false);
    }, 1500);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricsCard
        icon={<CampaignIcon />}
        label="Active Campaigns"
        value={metrics.activeCampaigns}
        isLoading={isLoading}
      />
      
      <MetricsCard
        icon={<SpendIcon />}
        label="Total Spent"
        value={metrics.totalSpent}
        isLoading={isLoading}
      />
      
      <MetricsCard
        icon={<TrophyIcon />}
        label="Auctions Won"
        value={metrics.auctionsWon}
        isLoading={isLoading}
      />
      
      <MetricsCard
        icon={<WalletIcon />}
        label="Wallet Balance"
        value={metrics.walletBalance}
        isGradient={true}
        isLoading={isLoading}
      />
    </div>
  );
}

/**
 * Example 6: Custom Styling
 * Add custom classes for additional styling
 */
export function CustomStyledCardExample() {
  return (
    <MetricsCard
      icon={<CampaignIcon />}
      label="Active Campaigns"
      value={5}
      className="hover:scale-105 transition-transform"
    />
  );
}
