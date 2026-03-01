import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0510] font-sans text-slate-100 selection:bg-[#8c25f4]/30">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(at 50% 50%, rgba(140, 37, 244, 0.2) 0px, transparent 60%)
          `
        }}
      />
      
      <header className="relative z-50 flex items-center justify-between px-6 py-6 mx-auto max-w-7xl lg:px-12">
        <Link href="/" className="flex items-center gap-3 decoration-transparent">
          <div className="flex items-center justify-center p-2 rounded-lg bg-[#8c25f4]/20 text-[#8c25f4]">
            <span className="text-2xl font-bold">🏢</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white m-0">Shelf<span className="text-[#8c25f4]">-Bidder</span></h2>
        </Link>
        <Link href="/" className="text-sm font-medium hover:text-[#8c25f4] transition-colors text-slate-300">← Back to Home</Link>
      </header>

      <main className="relative z-10 px-6 pt-16 pb-24 mx-auto max-w-5xl lg:px-12 text-center animate-fadeInUp">
        <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl mb-6">
          Unmatched <span className="text-[#8c25f4]">Analytics</span>
        </h1>
        <p className="text-xl text-slate-400 font-medium mb-16 max-w-2xl mx-auto">
          Make data-driven bidding decisions with our real-time visibility dashboard. We process millions of data points hourly across thousands of Kirana stores.
        </p>

        <div className="bg-[#160d21]/90 backdrop-blur-xl border border-[#8c25f4]/30 rounded-3xl p-10 mt-12 overflow-hidden relative text-left">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#8c25f4]/20 rounded-full blur-[80px]"></div>
          <h3 className="text-3xl font-black text-white mb-6 relative z-10">AI Computer Vision</h3>
          <p className="text-lg text-slate-400 relative z-10 max-w-2xl mb-10">Our proprietary models detect over 15,000 SKUs under challenging lighting conditions, accurately measuring Share of Shelf (SoS) and out-of-stock events instantly.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            {[
              { label: 'Latency', value: '12ms' },
              { label: 'Accuracy', value: '98.4%' },
              { label: 'SKUs', value: '15k+' },
              { label: 'Models', value: '8 GenAI' }
             ].map((stat, i) => (
              <div key={i} className="bg-black/40 border border-[#8c25f4]/10 rounded-2xl p-6">
                <div className="text-3xl font-black text-[#8c25f4] mb-1">{stat.value}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
