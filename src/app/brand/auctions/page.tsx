'use client';

/**
 * Brand Auctions Page
 * View active auctions and place bids
 */

import { useState } from 'react';

// MOCK_AUCTIONS removed for real API

export default function BrandAuctionsPage() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [bidding, setBidding] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  // Fetch active auctions
  const fetchAuctions = () => {
    fetch('/api/brand/auctions')
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setAuctions(resData.data);
        }
      })
      .finally(() => setLoading(false));
  };

  import('react').then(React => {
    React.useEffect(() => {
      // Load custom products
      const savedProducts = localStorage.getItem('brand_products');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        setAvailableProducts(parsed);
        if (parsed.length > 0) setSelectedProduct(parsed[0].name);
      } else {
        // Fallback defaults
        const defaults = [{ name: 'Pepsi 500ml' }, { name: 'Lays Classic 50g' }];
        setAvailableProducts(defaults);
        setSelectedProduct(defaults[0].name);
      }

      fetchAuctions();
      const interval = setInterval(fetchAuctions, 15000); // Live poll
      return () => clearInterval(interval);
    }, []);
  });

  const handleBid = async (auctionId: string) => {
    if (!bidAmount || Number(bidAmount) <= 0) return;
    
    const brandName = localStorage.getItem('brandName') || 'Brand';
    const brandId = localStorage.getItem('brandId') || 'default-brand';

    try {
      const resp = await fetch('/api/brand/auctions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-brand-id': brandId 
        },
        body: JSON.stringify({
          auctionId,
          amount: Number(bidAmount),
          productName: selectedProduct,
          brandName
        })
      });
      
      const result = await resp.json();
      
      if (result.success) {
        setBidSuccess(auctionId);
        setBidding(null);
        setBidAmount('');
        fetchAuctions(); // Refresh to show new bid

        setTimeout(() => setBidSuccess(null), 3000);
      } else {
        alert('Bid failed: ' + result.error);
      }
    } catch (e) {
      alert('Network error while placing bid');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#0a0510] text-white">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <p className="font-bold tracking-widest uppercase text-sm text-[var(--brand-violet)] animate-pulse">Scanning Auctions</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[10%] left-[-20%] w-[50%] aspect-square rounded-full bg-[var(--brand-violet)]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] aspect-square rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="p-4 pt-12 pb-2 relative z-10">
        <h1 className="text-2xl font-black text-white/90 tracking-tight">Active Auctions</h1>
        <p className="text-[10px] font-bold mt-1 text-slate-400 uppercase tracking-widest">
          {auctions.length} shelf spaces available for bidding
        </p>
      </header>

      {/* Success Toast */}
      {bidSuccess && (
        <div className="mx-4 p-4 rounded-2xl mb-3 animate-fadeInUp bg-green-500/10 border border-green-500/20 relative z-10 shadow-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm">
            ✅
          </div>
          <p className="text-sm font-bold text-[var(--accent-green)]">
            Bid submitted successfully!
          </p>
        </div>
      )}

      {/* Auction List */}
      <section className="px-4 py-3 relative z-10 pb-24">
        <div className="space-y-4">
          {auctions.map((auction, i) => (
            <div key={auction.id}
                 className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden animate-fadeInUp shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-slate-700 transition-colors"
                 style={{ animationDelay: `${i * 0.08}s` }}>
              {/* Auction Header */}
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-base font-bold text-white/90">{auction.shelfLocation}</p>
                    <p className="text-[10px] font-bold mt-1 text-slate-500 uppercase tracking-widest">
                      📍 {auction.shopkeeperArea}
                    </p>
                  </div>
                  <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
                    <span className="animate-pulse">⏱</span> {auction.endsIn}
                  </span>
                </div>

                {/* Auction Details */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="text-center p-3 rounded-2xl bg-slate-950/50 border border-slate-800/50">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Space</p>
                    <p className="text-sm font-bold text-white">{auction.spaceSize}</p>
                  </div>
                  <div className="text-center p-3 rounded-2xl bg-slate-950/50 border border-slate-800/50">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bids</p>
                    <p className="text-sm font-bold text-white">{auction.currentBids}</p>
                  </div>
                  <div className="text-center p-3 rounded-2xl bg-[var(--brand-violet)]/10 border border-[var(--brand-violet)]/20 shadow-inner">
                    <p className="text-[9px] font-bold text-[var(--brand-violet)] uppercase tracking-widest mb-1">Highest</p>
                    <p className="text-lg font-black text-[var(--accent-green)]">₹{auction.highestBid}</p>
                  </div>
                </div>

                {/* Shelf Info */}
                <div className="flex gap-2 mt-4">
                  <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Level {auction.shelfLevel}
                  </span>
                  <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border ${
                    auction.visibility === 'High' 
                      ? 'bg-green-500/10 text-[var(--accent-green)] border-green-500/20' 
                      : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                  }`}>
                    👁 {auction.visibility}
                  </span>
                </div>
              </div>

              {/* Bid Section */}
              {bidding === auction.id ? (
                <div className="p-5 border-t border-slate-800 bg-slate-800/20">
                  <div className="flex gap-2 mb-3">
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="flex-1 p-3 rounded-xl text-sm font-medium bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-[var(--brand-violet)] focus:ring-1 focus:ring-[var(--brand-violet)] transition-all"
                    >
                      {availableProducts.map((p, idx) => (
                        <option key={idx} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">₹</span>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Min ₹${auction.highestBid + 1}`}
                        className="w-full p-3 pl-8 rounded-xl text-sm font-bold bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--brand-violet)] focus:ring-1 focus:ring-[var(--brand-violet)] transition-all"
                      />
                    </div>
                    <button
                      onClick={() => handleBid(auction.id)}
                      className="px-5 rounded-xl text-sm font-bold bg-[var(--accent-green)] hover:bg-[#0bc94b] text-black transition-all shadow-lg shadow-[var(--accent-green)]/20"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setBidding(null)}
                      className="px-4 rounded-xl text-sm font-bold bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setBidding(auction.id)}
                  className="w-full p-4 text-sm font-bold border-t border-[var(--brand-violet)]/20 flex items-center justify-center gap-2 bg-[var(--brand-violet)]/10 text-[var(--brand-violet)] hover:bg-[var(--brand-violet)] hover:text-white transition-all group"
                >
                  <span className="group-hover:-translate-y-0.5 transition-transform">🏷️</span> Place Bid
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
