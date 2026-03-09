'use client';

/**
 * Auction Table Component
 * Feature: brand-dashboard-redesign
 * Task: 11.1 Create auction table component
 * 
 * Displays live auctions with auto-refresh and bid functionality
 */

import { useEffect, useState } from 'react';
import { fetchAuctions, submitBid } from '@/lib/api';

interface Auction {
  id: string;
  shelfLocation: string;
  shopkeeperArea: string;
  spaceSize: string;
  shelfLevel: number;
  visibility: 'High' | 'Medium' | 'Low';
  currentBids: number;
  highestBid: number;
  basePrice: number;
  endsIn: string;
  status: 'active' | 'closed' | 'won';
  highestBidder?: string;
}

interface AuctionTableProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function AuctionTable({ autoRefresh = true, refreshInterval = 30000 }: AuctionTableProps) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [biddingAuctionId, setBiddingAuctionId] = useState<string | null>(null);

  const loadAuctions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = await fetchAuctions();
      setAuctions(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch auctions:', err);
      setError('Failed to load auctions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAuctions();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadAuctions(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const handleBidNow = async (auction: Auction) => {
    try {
      setBiddingAuctionId(auction.id);
      
      const brandName = localStorage.getItem('brandName') || 'Unknown Brand';

      // Calculate bid amount (base price + 10% or highest bid + 10%)
      const bidAmount = Math.max(auction.basePrice, auction.highestBid) * 1.1;

      await submitBid({
        auctionId: auction.id,
        amount: bidAmount,
        productName: 'Product', // This should come from selected product
        brandName,
      });

      alert('Bid placed successfully!');
      
      // Refresh auctions after successful bid
      await loadAuctions(true);
    } catch (err) {
      console.error('Failed to place bid:', err);
      alert('Failed to place bid. Please try again.');
    } finally {
      setBiddingAuctionId(null);
    }
  };

  const handleRetry = () => {
    loadAuctions();
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₹0';
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getBrandName = () => {
    return localStorage.getItem('brandName') || '';
  };

  const isHighestBidder = (auction: Auction) => {
    return auction.highestBidder === getBrandName();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff5c61]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#64748b] mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="bg-[#ff5c61] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#ff4a50] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="text-center py-12 text-[#64748b]">
        <p>No auctions available at the moment. Check back soon!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Last Update Indicator */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#64748b]">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
        {refreshing && (
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#ff5c61]"></div>
            <span>Refreshing...</span>
          </div>
        )}
      </div>

      {/* Auction Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e293b]">Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e293b]">Area</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e293b]">Size</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e293b]">Level</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e293b]">Visibility</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e293b]">Base Price</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e293b]">Highest Bid</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e293b]">Bids</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[#1e293b]">Action</th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((auction) => {
              const isWinning = isHighestBidder(auction);
              return (
                <tr
                  key={auction.id}
                  className={`border-b border-gray-100 hover:bg-[#f8f5f5] transition-colors ${
                    isWinning ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-sm text-[#1e293b]">{auction.shelfLocation}</td>
                  <td className="py-3 px-4 text-sm text-[#64748b]">{auction.shopkeeperArea}</td>
                  <td className="py-3 px-4 text-sm text-[#64748b]">{auction.spaceSize}</td>
                  <td className="py-3 px-4 text-sm text-[#64748b]">{auction.shelfLevel}</td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        auction.visibility === 'High'
                          ? 'bg-green-100 text-green-700'
                          : auction.visibility === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {auction.visibility}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#1e293b] font-medium">
                    {formatCurrency(auction.basePrice)}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#1e293b] font-medium">
                    {auction.highestBid && auction.highestBid > 0 ? formatCurrency(auction.highestBid) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#64748b]">{auction.currentBids || 0}</td>
                  <td className="py-3 px-4">
                    {auction.status === 'active' && (
                      <button
                        onClick={() => handleBidNow(auction)}
                        disabled={biddingAuctionId === auction.id}
                        className="bg-[#ff5c61] text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-[#ff4a50] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {biddingAuctionId === auction.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Bidding...</span>
                          </>
                        ) : (
                          'Bid Now'
                        )}
                      </button>
                    )}
                    {isWinning && (
                      <span className="text-xs text-green-600 font-medium">Winning!</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
