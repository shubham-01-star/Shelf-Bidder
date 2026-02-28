'use client';

/**
 * Brand Auctions Page
 * View active auctions and place bids
 */

import { useState } from 'react';

interface MockAuction {
  id: string;
  shelfLocation: string;
  shopkeeperArea: string;
  spaceSize: string;
  shelfLevel: number;
  visibility: string;
  currentBids: number;
  highestBid: number;
  endsIn: string;
  status: 'active' | 'closed';
}

const MOCK_AUCTIONS: MockAuction[] = [
  { id: 'auc-201', shelfLocation: 'Front Counter - Left', shopkeeperArea: 'Connaught Place, Delhi', spaceSize: '30×40 cm', shelfLevel: 2, visibility: 'High', currentBids: 4, highestBid: 120, endsIn: '8 min', status: 'active' },
  { id: 'auc-202', shelfLocation: 'Main Aisle - Right', shopkeeperArea: 'Koramangala, Bangalore', spaceSize: '25×35 cm', shelfLevel: 3, visibility: 'Medium', currentBids: 2, highestBid: 85, endsIn: '12 min', status: 'active' },
  { id: 'auc-203', shelfLocation: 'Checkout Counter', shopkeeperArea: 'Bandra, Mumbai', spaceSize: '20×30 cm', shelfLevel: 1, visibility: 'High', currentBids: 6, highestBid: 150, endsIn: '3 min', status: 'active' },
  { id: 'auc-204', shelfLocation: 'Back Shelf - Top', shopkeeperArea: 'Jubilee Hills, Hyderabad', spaceSize: '35×45 cm', shelfLevel: 4, visibility: 'Low', currentBids: 1, highestBid: 45, endsIn: '14 min', status: 'active' },
];

export default function BrandAuctionsPage() {
  const [auctions] = useState<MockAuction[]>(MOCK_AUCTIONS);
  const [bidding, setBidding] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('Pepsi 500ml');
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);

  const handleBid = (auctionId: string) => {
    if (!bidAmount || Number(bidAmount) <= 0) return;

    // Simulate bid submission
    setBidSuccess(auctionId);
    setBidding(null);
    setBidAmount('');

    setTimeout(() => setBidSuccess(null), 3000);
  };

  return (
    <div className="page-container gradient-mesh">
      {/* Header */}
      <header className="p-4 pt-12 pb-2">
        <h1 className="text-2xl font-bold">Active Auctions</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {auctions.length} shelf spaces available for bidding
        </p>
      </header>

      {/* Success Toast */}
      {bidSuccess && (
        <div className="mx-4 p-3 rounded-xl mb-3 animate-fadeInUp"
             style={{ background: 'rgba(0, 214, 143, 0.15)', border: '1px solid rgba(0, 214, 143, 0.3)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--accent-green)' }}>
            ✅ Bid submitted successfully!
          </p>
        </div>
      )}

      {/* Auction List */}
      <section className="px-4 py-3">
        <div className="space-y-4">
          {auctions.map((auction, i) => (
            <div key={auction.id}
                 className="glass-card overflow-hidden animate-fadeInUp"
                 style={{ animationDelay: `${i * 0.08}s` }}>
              {/* Auction Header */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold">{auction.shelfLocation}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      📍 {auction.shopkeeperArea}
                    </p>
                  </div>
                  <span className="badge badge-warning">⏱ {auction.endsIn}</span>
                </div>

                {/* Auction Details */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Space</p>
                    <p className="text-sm font-semibold">{auction.spaceSize}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Bids</p>
                    <p className="text-sm font-semibold">{auction.currentBids}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Highest</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--accent-green)' }}>₹{auction.highestBid}</p>
                  </div>
                </div>

                {/* Shelf Info */}
                <div className="flex gap-2 mt-3">
                  <span className="badge badge-info">Level {auction.shelfLevel}</span>
                  <span className="badge" style={{
                    background: auction.visibility === 'High' ? 'rgba(0, 214, 143, 0.15)' : 'rgba(255, 170, 0, 0.15)',
                    color: auction.visibility === 'High' ? 'var(--accent-green)' : 'var(--accent-yellow)',
                  }}>
                    👁 {auction.visibility}
                  </span>
                </div>
              </div>

              {/* Bid Section */}
              {bidding === auction.id ? (
                <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex gap-2 mb-3">
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option>Pepsi 500ml</option>
                      <option>Lays Classic 50g</option>
                      <option>Pepsi Diet 330ml</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>₹</span>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Min ₹${auction.highestBid + 1}`}
                        className="w-full p-2.5 pl-7 rounded-xl text-sm"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                    <button
                      onClick={() => handleBid(auction.id)}
                      className="btn btn-success"
                      style={{ padding: '10px 16px', minHeight: 'auto', fontSize: '13px' }}
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setBidding(null)}
                      className="btn btn-outline"
                      style={{ padding: '10px 12px', minHeight: 'auto', fontSize: '13px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setBidding(auction.id)}
                  className="w-full p-3 text-sm font-semibold border-t flex items-center justify-center gap-2"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'rgba(108, 99, 255, 0.08)',
                    color: 'var(--primary-light)',
                    cursor: 'pointer',
                  }}
                >
                  🏷️ Place Bid
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
