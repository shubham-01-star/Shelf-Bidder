/**
 * MetricsCardsContainer Example
 * Feature: brand-dashboard-redesign
 * Task: 6.2 Build metrics cards container
 * 
 * This example demonstrates the MetricsCardsContainer component
 * with live data fetching from the API.
 */

import React from 'react';
import { MetricsCardsContainer } from './MetricsCardsContainer';

export default function MetricsCardsContainerExample() {
  return (
    <div className="min-h-screen bg-[#f8f5f5] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1e293b] mb-2">
          Metrics Cards Container
        </h1>
        <p className="text-[#64748b] mb-8">
          Displays 4 key metrics in a responsive grid layout with live data from the API.
        </p>

        {/* Metrics Cards Container */}
        <MetricsCardsContainer />

        {/* Documentation */}
        <div className="mt-12 bg-white rounded-[1.5rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <h2 className="text-2xl font-bold text-[#1e293b] mb-4">
            Features
          </h2>
          <ul className="space-y-3 text-[#64748b]">
            <li className="flex items-start gap-3">
              <span className="text-[#ff5c61] font-bold">✓</span>
              <span>Fetches data from GET /api/brand/dashboard on mount</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff5c61] font-bold">✓</span>
              <span>Updates all 4 cards simultaneously when data loads</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff5c61] font-bold">✓</span>
              <span>Displays loading skeletons during data fetch</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff5c61] font-bold">✓</span>
              <span>Handles API errors with placeholder values and error banner</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff5c61] font-bold">✓</span>
              <span>Responsive grid: 1 column on mobile, 2x2 on desktop</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff5c61] font-bold">✓</span>
              <span>Wallet Balance card uses gradient styling (purple-600 to blue-600)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff5c61] font-bold">✓</span>
              <span>Currency values formatted with ₹ symbol and thousand separators</span>
            </li>
          </ul>

          <div className="mt-8 p-6 bg-[#f8f5f5] rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-[#1e293b] mb-2">
              Metrics Displayed:
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <p className="font-medium text-[#1e293b]">Active Campaigns</p>
                <p className="text-[#64748b]">Number of currently running campaigns</p>
              </div>
              <div>
                <p className="font-medium text-[#1e293b]">Total Spent</p>
                <p className="text-[#64748b]">Total amount spent on campaigns</p>
              </div>
              <div>
                <p className="font-medium text-[#1e293b]">Auctions Won</p>
                <p className="text-[#64748b]">Number of successful auction bids</p>
              </div>
              <div>
                <p className="font-medium text-[#1e293b]">Wallet Balance</p>
                <p className="text-[#64748b]">Current available wallet balance</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
            <h3 className="text-lg font-semibold text-[#1e293b] mb-2">
              Responsive Behavior
            </h3>
            <p className="text-[#64748b] text-sm mb-4">
              The grid layout adapts to different screen sizes:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#1e293b]">Mobile (&lt; 768px):</span>
                <span className="text-[#64748b]">1 column, stacked vertically</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#1e293b]">Desktop (≥ 768px):</span>
                <span className="text-[#64748b]">2x2 grid layout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
