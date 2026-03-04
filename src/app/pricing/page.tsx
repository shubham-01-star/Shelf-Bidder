import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background-light dark:bg-background-dark font-sans text-slate-100 selection:bg-[#0df259]/30">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(140, 37, 244, 0.1) 0%, transparent 100%)
          `
        }}
      />
      
      <header className="relative z-50 flex items-center justify-between px-6 py-6 mx-auto max-w-7xl lg:px-12">
        <Link href="/" className="flex items-center gap-2 decoration-transparent">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">storefront</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">Shelf-Bidder</span>
        </Link>
        <Link href="/" className="text-sm font-medium hover:text-[#8c25f4] transition-colors text-slate-300">← Back to Home</Link>
      </header>

      <main className="relative z-10 px-6 pt-16 pb-24 mx-auto max-w-5xl lg:px-12 text-center animate-fadeInUp">
        <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl mb-6">
          Transparent <span className="text-[#8c25f4]">Pricing</span>
        </h1>
        <p className="text-xl text-slate-400 font-medium mb-16 max-w-2xl mx-auto">
          You only pay for verifiable shelf execution. No hidden fees, no retainer contracts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          <div className="p-10 rounded-3xl bg-surface-light dark:bg-surface-dark/80 backdrop-blur-xl border border-slate-800 flex flex-col">
            <h3 className="text-2xl font-black text-white mb-2">Shopkeepers</h3>
            <div className="text-4xl font-black text-[#0df259] mb-6">Free Forever</div>
            <p className="text-slate-400 mb-8">Join the network, monetize your premium shelf space, and withdraw earnings directly to UPI instantly.</p>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3"><span className="text-[#0df259]">✓</span> $0 platform fees</li>
              <li className="flex items-center gap-3"><span className="text-[#0df259]">✓</span> Instant UPI settlements</li>
              <li className="flex items-center gap-3"><span className="text-[#0df259]">✓</span> Earn up to ₹500/day</li>
            </ul>
            <Link href="/signin" className="block text-center w-full py-4 bg-[#0df259]/20 hover:bg-[#0df259] text-[#0df259] hover:text-black font-bold rounded-xl transition-colors">
              Join Network
            </Link>
          </div>

          <div className="p-10 rounded-3xl bg-gradient-to-b from-[#8c25f4]/20 to-[#160d21]/80 backdrop-blur-xl border border-[#8c25f4]/50 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#8c25f4] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-lg">Enterprise</div>
            <h3 className="text-2xl font-black text-white mb-2">Brands</h3>
            <div className="text-4xl font-black text-[#8c25f4] mb-6">Pay Per Bid</div>
            <p className="text-slate-400 mb-8">Set your budget, run autonomous AI bidding agents, and capture premium shelf reality.</p>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3"><span className="text-[#8c25f4]">✓</span> 100% verified execution</li>
              <li className="flex items-center gap-3"><span className="text-[#8c25f4]">✓</span> Full API access</li>
              <li className="flex items-center gap-3"><span className="text-[#8c25f4]">✓</span> Dedicated account manager</li>
            </ul>
            <Link href="/brand/login" className="block text-center w-full py-4 bg-[#8c25f4] hover:bg-[#8c25f4]/90 text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#8c25f4]/30">
              Start Bidding
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
