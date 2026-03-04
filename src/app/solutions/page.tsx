import Link from 'next/link';

export default function SolutionsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background-light dark:bg-background-dark font-sans text-slate-100 selection:bg-[#8c25f4]/30">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(140, 37, 244, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(13, 242, 89, 0.05) 0px, transparent 50%)
          `
        }}
      />
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'radial-gradient(rgba(140, 37, 244, 0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
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

      <main className="relative z-10 px-6 pt-16 pb-24 mx-auto max-w-4xl lg:px-12 text-center animate-fadeInUp">
        <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl mb-6">
          Enterprise <span className="text-[#8c25f4]">Solutions</span>
        </h1>
        <p className="text-xl text-slate-400 font-medium mb-16">
          End-to-end retail media networks powered by AI bidding algorithms. Unlocking unprecedented visibility for global FMCG brands in emerging markets.
        </p>

        <div className="grid gap-8 text-left">
          <div className="p-8 rounded-3xl bg-surface-light dark:bg-surface-dark/80 backdrop-blur-xl border border-[#8c25f4]/20 hover:border-[#8c25f4]/50 transition-colors">
            <h3 className="text-2xl font-black text-white mb-4">Hyper-Local Targeting</h3>
            <p className="text-slate-400">Target your products down to the exact neighborhood and store tier using our vast network of verified Kirana partners mapped seamlessly via GPS and historical sales data.</p>
          </div>
          <div className="p-8 rounded-3xl bg-surface-light dark:bg-surface-dark/80 backdrop-blur-xl border border-[#0df259]/20 hover:border-[#0df259]/50 transition-colors">
            <h3 className="text-2xl font-black text-white mb-4">Proof of Execution (PoE)</h3>
            <p className="text-slate-400">Our advanced AI computer vision analyzes shopkeeper uploads in real-time, confirming shelf placement, share of shelf, and competitor proximity with 98.4% accuracy before automating instant micropayments.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
