'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const categories = [
  { name: 'Beverages', icon: 'local_cafe' },
  { name: 'Snacks', icon: 'cookie' },
  { name: 'Personal Care', icon: 'clean_hands' },
  { name: 'Counter Top', icon: 'counter_1' },
  { name: 'Entrance', icon: 'door_front' },
];

const auctions = [
  {
    id: 1,
    title: 'Main Counter Shelf',
    location: 'Sector 44, Gurgaon',
    winner: 'Coke',
    price: '₹450',
    rating: '4.9',
    status: 'live',
    statusLabel: 'Live Auction',
    statusColor: 'bg-green-500',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCs9EVgc1zjGCMnkbKQryhtphytgRAl_FGW6j00-Q6d6hyOQ3DbG7ytsEzEtxFvdpngYvLx11Nt6_CpPdy47Xx_gDSo0xDNiI3ZXbYGnM64YQngNUBk5ays4FRYu1xszc6QqfGjD9QDiqQjN5dBcRBOgiGjooRbPTz7_SfiLPVXj4JisFz-78fH3icYYQ2-tJONAqNCf0TnNeO4iQPzey_Eh8N7FWCWcxdfv29G4TJIbIUQP_my4ET95rZ0X8xb1hx_CO2mzkLQ-JI',
    alt: 'Organized retail shelf with beverages',
  },
  {
    id: 2,
    title: 'Entrance Gondola',
    location: 'DLF Phase 3, Gurgaon',
    winner: 'Lays',
    price: '₹1,200',
    rating: '4.8',
    status: 'live',
    statusLabel: 'Live Auction',
    statusColor: 'bg-green-500',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBL4Na0Et4EpYjKjuOpwthz_yIsp3D_XT_9uivxOgLpGu2UQaT8j8xGGLTY-U8xLUqO8xDfqX1BFLxwk7O3v1PBKN4E_5D65uQVWEaiDIP3_cIgbhfnE7gEW1i3Vr-S-kVePTNzfQ6E5CdNEDtogP9bDxP512HpoQqN28Ai-ceFP6RSYbJjsp1jCgRjK8TpDe7XsgiPdj7Ti6lg8xaL6SaXwzjLDPvW77ZqtN8uX0Fb9BxFAeV9UgooJ_W0WGCTp42xp9VqZ66fyd0',
    alt: 'Grocery store aisle with snacks',
  },
  {
    id: 3,
    title: 'Beverage Cooler',
    location: 'Cyber City, Gurgaon',
    winner: 'Pepsi',
    price: '₹950',
    rating: '5.0',
    status: 'ending',
    statusLabel: 'Ending Soon',
    statusColor: 'bg-red-500',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYlSSPyaeSp3Yi3DG0gsCBwUnur18KvyPl4jiv6ZWDzR84fzQWocHYaaOILn4OvsZ8ObgrdsTYc1qkhZjAc9Ef6xrcOYmCjmTSfSmAxmUBxMXUvCK7xh0gXrH8fDz-70x6uD4VnrotFBM3gMIgxzD1UJy4hapcubEveRS63S-wX8kV53i8G_Nd0LHCEPmKhunUQ_Qu718tE1cYxwAM3O4BwmmHD-1jAlbkCFxIWx3JtiwFprLT6bFmV3vxHdeD3VSZRnU5cwvB33U',
    alt: 'Refrigerated display shelf in store',
  },
];

export default function Home() {
  const router = useRouter();
  const auctionsSectionRef = useRef<HTMLElement>(null);

  // State
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Beverages');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [voiceAlerts, setVoiceAlerts] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearch = () => {
    const query = searchLocation.trim() || 'Gurgaon';
    router.push(`/dashboard?location=${encodeURIComponent(query)}`);
  };

  const scrollToAuctions = () => {
    auctionsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-gray-100 min-h-screen flex flex-col overflow-x-hidden">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-[60] bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl">storefront</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">Shelf-Bidder</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/signup" className="text-sm font-medium hover:text-primary transition-colors hidden md:block">
              Become a Host
            </Link>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full p-1 pl-3 pr-1 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <span className="material-symbols-outlined text-gray-500 text-[20px]">menu</span>
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white overflow-hidden">
                  <span className="material-symbols-outlined text-lg">person</span>
                </div>
              </button>
              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-[fadeIn_0.15s_ease-out]">
                  <Link href="/signin" className="block px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => setMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/signup" className="block px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => setMenuOpen(false)}>
                    Sign Up
                  </Link>
                  <div className="h-[1px] bg-gray-100 dark:bg-gray-800 my-1"></div>
                  <Link href="/profile" className="block px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link href="/dashboard" className="block px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/wallet" className="block px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => setMenuOpen(false)}>
                    Wallet
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-[55]" onClick={() => setMenuOpen(false)} />
      )}

      {/* Floating Search Bar (Mobile Optimized) */}
      <div className="px-4 py-4 sticky top-[65px] z-40 bg-background-light dark:bg-background-dark md:relative md:top-0 md:bg-transparent md:pt-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-surface-light dark:bg-surface-dark rounded-full shadow-float border border-gray-100 dark:border-gray-700 p-2 flex items-center">
            <div className="flex-1 px-4 flex flex-col justify-center border-r border-gray-200 dark:border-gray-700">
              <span className="text-[10px] font-bold text-text-main uppercase tracking-wider">Location</span>
              <input
                className="w-full bg-transparent border-none p-0 text-sm text-text-sub focus:ring-0 focus:outline-none placeholder-gray-400"
                placeholder="Gurgaon"
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="hidden sm:flex flex-1 px-4 flex-col justify-center border-r border-gray-200 dark:border-gray-700">
              <span className="text-[10px] font-bold text-text-main uppercase tracking-wider">Shelf Type</span>
              <span className="text-sm text-text-sub truncate">Eye-Level</span>
            </div>
            <button
              onClick={handleSearch}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-dark transition-colors cursor-pointer ml-2 flex-shrink-0"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col gap-10 pb-24">
        {/* Hero Section */}
        <section className="px-4 pt-4 md:pt-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-6 order-2 md:order-1">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">New Marketplace</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-text-main dark:text-white leading-[1.1] tracking-tight">
                  Turn Your Shop&apos;s Empty Shelves into <span className="text-primary">Digital Real Estate</span>
                </h1>
                <p className="text-lg md:text-xl text-text-sub dark:text-gray-400 font-medium">
                  Apni dukan ki khali shelves se extra kamai karein. Join India&apos;s first retail shelf bidding platform.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="flex-1 sm:flex-none h-14 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-base transition-transform active:scale-95 shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                >
                  <span>Register as Shopkeeper</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <Link
                  href="/brand/login"
                  className="flex-1 sm:flex-none h-14 px-8 bg-surface-light dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-text-main dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-base transition-transform active:scale-95 flex items-center justify-center"
                >
                  Bid as a Brand
                </Link>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white dark:border-surface-dark bg-gray-200" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDoJgBZ2mJ537p4UJoYAZ7R7aG6ociKV1wgvbBGpv7n1hhpOOiDLVDojmMkmiOkVTIDGf2Ns0T4C-Jggxfb-qxteqnodzWjThXaekFaakURjAX4y9p4-dzp7bE1DiNv_Lvs7XMB8KcnXXve8UwqGC-1lYB7cmfwVTYUTTidr4czZTp1KeDRbbktYMnm8qnK7fABC7xTVHL261yiCnIh7Gr8eb1fWljowXPzUqvgVrSZL4L9yKZ2AZg5P0DYhcdpEAINdykTDlo9USs')", backgroundSize: "cover" }}></div>
                  <div className="w-10 h-10 rounded-full border-2 border-white dark:border-surface-dark bg-gray-200" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCiDQhaxbrFwazsD46Oqw0FS39kOUdpcn_3PYGBt6UrVOiF9Z_gJAHghte2JVgIEwq9IzqwTxVDlUnVfsMNXkvi0jsQIGPmImxzNz6G-mSYxUjXfU6EV16BM9JLh-yUSxaEs5EGT1f3Hmgyk3e7Fl7j443kDTL7HsMXu8zLikIZSuxpOq2lLxhf0vRA2HF8JvhQ8uXNABBLWgj2Gs9MF1ugBQQqK9m6kZAd5X3nO2arI-oz352mbhnWGjE_-mQ6AqnMiypi6FuePsA')", backgroundSize: "cover" }}></div>
                  <div className="w-10 h-10 rounded-full border-2 border-white dark:border-surface-dark bg-gray-200" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAMxBh4tvqC8DLnRaFLnrt8kyQ_2m75-TZkPrKJRSJ8-W6xuFl5k4FwMfCYCD_f9NZJp_XYZ165RfSitGTMrut04waIYdbhc_6km-ToaIV1Hrj_q1JE8ORB7_C7Y3W6HgVcolCFZVbw6N2-K5ybX2TrsLJQ_-dJ4l9c_wMnYbmmRjWBrOJqfoyg1C7hFOQD4kYJTGy8NIgOvkt_2xDJPHP-FrMSYBhVdHNzbpUyDousKG777my-buSPF0933e-4Offk3JgppYCM59k')", backgroundSize: "cover" }}></div>
                </div>
                <p className="text-sm text-text-sub dark:text-gray-400">Trusted by <span className="font-bold text-text-main dark:text-white">500+</span> Shopkeepers</p>
              </div>
            </div>
            
            <Link href="/dashboard" className="order-1 md:order-2 relative group block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Hero Image */}
                <div className="absolute inset-0 bg-gray-200 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" data-alt="Modern grocery store shelf stocked with products" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBvxheokVaDR4ixyFJqfAEIw5w3TOUi_MNDi7-jrj5S1Mxr0PSK-ZfMazgEbbh31DFlDNOHxlzvvriVG0_aaNQta5Vqtj_MygOcEC7X3CJc8TzAKMSm19ult14qExW9SgFBYt5KD-toJRQmv4wBFC_bwvw8Ip5WQWpOc5qgLDECr6SLJSxvThSYvnWrMIJyOpPlORfPN72D1aqX192NsOR3kU3ust1LO19vNvzEdZdjg9rt1BtjOv9N8OyHsSKbeHbclS94AUi1c-Q')", backgroundSize: "cover" }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                {/* Floating Card within Hero */}
                <div className="absolute bottom-6 left-6 right-6 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-bold text-text-sub uppercase mb-1">Live Auction</p>
                      <p className="font-bold text-text-main dark:text-white">Main Counter - Sector 56</p>
                      <p className="text-sm text-primary font-bold">₹850 <span className="text-xs font-normal text-text-sub">/ day</span></p>
                    </div>
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white animate-pulse">
                      <span className="material-symbols-outlined">gavel</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Category Filters */}
        <section className="px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8 overflow-x-auto no-scrollbar pb-2">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`flex flex-col items-center gap-2 min-w-[64px] group transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                  >
                    <div className={`transition-colors ${isActive ? 'text-text-main dark:text-white group-hover:text-primary' : 'text-text-sub dark:text-gray-400 group-hover:text-text-main dark:group-hover:text-white'}`}>
                      <span className="material-symbols-outlined text-[28px]">{cat.icon}</span>
                    </div>
                    <span className={`text-xs whitespace-nowrap pb-2 border-b-2 ${isActive ? 'font-semibold text-text-main dark:text-white border-text-main dark:border-white' : 'font-medium text-text-sub dark:text-gray-400 border-transparent group-hover:border-gray-300'}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="h-[1px] bg-gray-200 dark:bg-gray-800 w-full mt-[-1px]"></div>
          </div>
        </section>

        {/* Live Auctions Grid */}
        <section className="px-4" ref={auctionsSectionRef}>
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-main dark:text-white">Live Shelf Auctions</h2>
              <Link className="text-primary font-semibold text-sm hover:underline" href="/dashboard">View all</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <div key={auction.id} className="group cursor-pointer">
                  <Link href="/dashboard" className="block">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-gray-100">
                      <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-text-main dark:text-white z-10 shadow-sm flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${auction.statusColor} animate-pulse`}></span> {auction.statusLabel}
                      </div>
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(auction.id); }}
                          className={`w-8 h-8 rounded-full ${favorites.has(auction.id) ? 'bg-primary text-white' : 'bg-black/20 text-white'} hover:bg-primary/80 flex items-center justify-center backdrop-blur-sm transition-colors`}
                        >
                          <span className="material-symbols-outlined text-[20px]" style={favorites.has(auction.id) ? { fontVariationSettings: "'FILL' 1" } : undefined}>favorite</span>
                        </button>
                      </div>
                      <div className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110" data-alt={auction.alt} style={{ backgroundImage: `url('${auction.image}')` }}></div>
                    </div>
                  </Link>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-text-main dark:text-white text-lg">{auction.title}</h3>
                      <p className="text-text-sub text-sm">{auction.location}</p>
                      <p className="text-text-sub text-sm mt-1">Winning: <span className="font-medium text-text-main dark:text-white">{auction.winner}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-lg">{auction.price}<span className="text-sm text-text-sub font-normal"> /day</span></p>
                      <div className="flex items-center gap-1 justify-end mt-1 text-xs font-medium text-text-sub">
                        <span className="material-symbols-outlined text-[14px]">star</span> {auction.rating}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works & Stats Section */}
        <section className="px-4 py-8 bg-surface-light dark:bg-surface-dark border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Steps */}
              <div>
                <h2 className="text-3xl font-black text-text-main dark:text-white mb-8">Simple steps to start earning</h2>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">photo_camera</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-main dark:text-white">1. Snap it</h3>
                      <p className="text-text-sub dark:text-gray-400 leading-relaxed">Take a photo of your empty shelf or counter space.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">gavel</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-main dark:text-white">2. Auction it</h3>
                      <p className="text-text-sub dark:text-gray-400 leading-relaxed">Brands bid for your space in real-time auctions.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-main dark:text-white">3. Earn it</h3>
                      <p className="text-text-sub dark:text-gray-400 leading-relaxed">Get paid daily directly to your UPI account.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Host Dashboard Preview */}
              <div className="relative flex justify-center">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl -z-10"></div>
                <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-float border border-gray-100 dark:border-gray-700 w-full max-w-sm relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-text-main dark:text-white">My Earnings</h4>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Active</span>
                  </div>
                  <div className="mb-6 text-center">
                    <span className="text-sm text-text-sub">Total Balance</span>
                    <h2 className="text-4xl font-black text-text-main dark:text-white mt-1">₹12,500</h2>
                    <p className="text-xs text-green-600 font-medium mt-1 flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-sm">trending_up</span> +15% this week
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-blue-600 text-sm">campaign</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-main dark:text-white">Voice Alerts</p>
                          <p className="text-[10px] text-text-sub">Get notified on bids</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setVoiceAlerts(!voiceAlerts)}
                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${voiceAlerts ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-200 ${voiceAlerts ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>
                    <Link
                      href="/wallet"
                      className="w-full py-3 bg-text-main dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold mt-2 block text-center"
                    >
                      Withdraw Funds
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="px-4 pb-10">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm font-bold text-text-sub uppercase tracking-widest mb-8">Trusted by Top Brands</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 group">
                <div className="h-8 md:h-10 w-auto font-black italic text-2xl md:text-3xl text-red-600">ColaBrand</div>
                <span className="material-symbols-outlined text-blue-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Verified Partner">verified</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 via-white to-blue-600"></div>
                <div className="h-8 md:h-10 w-auto font-bold text-xl md:text-2xl text-blue-800 flex items-center">Bebsi</div>
                <span className="material-symbols-outlined text-blue-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Verified Partner">verified</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="h-8 md:h-10 w-auto font-bold text-xl md:text-2xl text-orange-600 flex items-center">SnackCo</div>
                <span className="material-symbols-outlined text-blue-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Verified Partner">verified</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="h-8 md:h-10 w-auto font-serif font-bold text-xl md:text-2xl text-purple-800 flex items-center">ChocoLatte</div>
                <span className="material-symbols-outlined text-blue-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Verified Partner">verified</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-light dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 pb-safe">
        <div className="flex justify-around items-center px-2 py-3">
          <Link href="/" className="flex flex-1 flex-col items-center justify-center gap-1 group">
            <div className="text-primary group-hover:scale-110 transition-transform flex h-6 items-center justify-center">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>explore</span>
            </div>
            <p className="text-primary text-[10px] font-medium leading-normal tracking-[0.015em]">Explore</p>
          </Link>
          <Link href="/dashboard" className="flex flex-1 flex-col items-center justify-center gap-1 group">
            <div className="text-text-sub group-hover:text-primary transition-colors flex h-6 items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">gavel</span>
            </div>
            <p className="text-text-sub group-hover:text-primary transition-colors text-[10px] font-medium leading-normal tracking-[0.015em]">Auctions</p>
          </Link>
          <Link href="/camera" className="flex flex-1 flex-col items-center justify-center gap-1 group">
            <div className="text-text-sub group-hover:text-primary transition-colors flex h-6 items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">storefront</span>
            </div>
            <p className="text-text-sub group-hover:text-primary transition-colors text-[10px] font-medium leading-normal tracking-[0.015em]">My Shop</p>
          </Link>
          <Link href="/dashboard" className="flex flex-1 flex-col items-center justify-center gap-1 group">
            <div className="text-text-sub group-hover:text-primary transition-colors flex h-6 items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">favorite</span>
            </div>
            <p className="text-text-sub group-hover:text-primary transition-colors text-[10px] font-medium leading-normal tracking-[0.015em]">Saved</p>
          </Link>
          <Link href="/profile" className="flex flex-1 flex-col items-center justify-center gap-1 group">
            <div className="text-text-sub group-hover:text-primary transition-colors flex h-6 items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">person</span>
            </div>
            <p className="text-text-sub group-hover:text-primary transition-colors text-[10px] font-medium leading-normal tracking-[0.015em]">Profile</p>
          </Link>
        </div>
      </nav>

      {/* Show Map Button */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40">
        <button
          onClick={scrollToAuctions}
          className="bg-text-main hover:bg-black text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold transition-transform hover:scale-105"
        >
          <span className="material-symbols-outlined text-sm">map</span>
          Show Map
        </button>
      </div>
    </div>
  );
}
