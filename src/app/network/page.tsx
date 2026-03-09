import Link from 'next/link';

export default function NetworkPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background-light dark:bg-background-dark font-sans text-slate-100 selection:bg-[#0df259]/30">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(at 100% 0%, rgba(13, 242, 89, 0.15) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(140, 37, 244, 0.05) 0px, transparent 50%)
          `
        }}
      />
      
      <header className="relative z-50 flex items-center justify-between px-6 py-6 mx-auto max-w-7xl lg:px-12">
        <Link href="/" className="flex items-center gap-3 decoration-transparent">
          <div className="flex items-center justify-center p-2 rounded-lg bg-[#0df259]/20 text-[#0df259]">
            <span className="text-2xl font-bold">🏪</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white m-0">Shelf<span className="text-[#0df259]">-Bidder</span></h2>
        </Link>
        <Link href="/" className="text-sm font-medium hover:text-[#0df259] transition-colors text-slate-300">← Back to Home</Link>
      </header>

      <main className="relative z-10 px-6 pt-16 pb-24 mx-auto max-w-5xl lg:px-12 text-center animate-fadeInUp">
        <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl mb-6">
          The <span className="text-[#0df259]">Kirana</span> Network
        </h1>
        <p className="text-xl text-slate-400 font-medium mb-16 max-w-2xl mx-auto">
          We aggregate the fragmented traditional retail sector into a unified, biddable media platform offering greater reach than total modern trade.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#0df259]/10 to-transparent border border-[#0df259]/20">
            <div className="text-5xl font-black text-white mb-2">50,000+</div>
            <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Active Stores</div>
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#0df259]/10 to-transparent border border-[#0df259]/20">
            <div className="text-5xl font-black text-white mb-2">300+</div>
            <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Cities Covered</div>
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#0df259]/10 to-transparent border border-[#0df259]/20">
            <div className="text-5xl font-black text-white mb-2">12M+</div>
            <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Daily Eyeballs</div>
          </div>
        </div>
      </main>
    </div>
  );
}
