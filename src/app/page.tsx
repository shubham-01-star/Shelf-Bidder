import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0510] font-sans text-slate-100 selection:bg-[#8c25f4]/30">
      {/* Background Mesh Gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(140, 37, 244, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(13, 242, 89, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(140, 37, 244, 0.1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(13, 242, 89, 0.05) 0px, transparent 50%)
          `
        }}
      />
      {/* Background Data Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'radial-gradient(rgba(140, 37, 244, 0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Navigation */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 mx-auto max-w-7xl lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2 rounded-lg bg-[#8c25f4]/20 text-[#8c25f4]">
            <span className="text-2xl font-bold">🏢</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Shelf<span className="text-[#8c25f4]">-Bidder</span></h2>
        </div>
        
        <nav className="hidden md:flex items-center gap-10">
          <Link href="/solutions" className="text-sm font-medium hover:text-[#8c25f4] transition-colors text-slate-300">Solutions</Link>
          <Link href="/network" className="text-sm font-medium hover:text-[#8c25f4] transition-colors text-slate-300">Network</Link>
          <Link href="/analytics" className="text-sm font-medium hover:text-[#8c25f4] transition-colors text-slate-300">Analytics</Link>
          <Link href="/pricing" className="text-sm font-medium hover:text-[#8c25f4] transition-colors text-slate-300">Pricing</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/signin" className="px-6 py-2.5 text-sm font-bold transition-all bg-[#8c25f4]/10 hover:bg-[#8c25f4]/20 rounded-xl text-[#8c25f4]">
            Login
          </Link>
          <Link href="/signin" className="px-6 py-2.5 text-sm font-bold transition-all bg-[#8c25f4] hover:bg-[#8c25f4]/90 text-white rounded-xl shadow-lg shadow-[#8c25f4]/25">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 pt-16 pb-24 mx-auto max-w-7xl lg:px-12 text-center animate-fadeInUp">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium rounded-full bg-[#8c25f4]/10 border border-[#8c25f4]/20 text-[#8c25f4]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8c25f4] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8c25f4]"></span>
          </span>
          Guaranteed Payouts for Kiranas. 100% Verified Shelf Execution for Brands.
        </div>
        
        <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl lg:leading-[1.1]">
          The first digital shelf-bidding engine for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8c25f4] to-[#0df259]">General Trade</span>
        </h1>
        
        <p className="mx-auto mt-8 max-w-2xl text-lg text-slate-400 font-medium">
          Ditch the middlemen. Shopkeepers get paid instantly for organizing shelves. Brands only pay when AI verifies their product is actually visible. It's a win-win.
        </p>

        {/* Massive Selection Cards */}
        <div className="grid grid-cols-1 gap-8 mt-20 lg:grid-cols-2 animate-fadeInUp animate-fadeInUp-delay-1">
          {/* Shopkeeper Card */}
          <Link href="/signin" className="group relative p-1 rounded-2xl bg-gradient-to-br from-[#0df259]/30 to-transparent hover:from-[#0df259]/60 transition-all duration-500 block text-left" style={{ textDecoration: 'none' }}>
            <div className="bg-[#160d21]/80 backdrop-blur-xl border border-[#0df259]/20 h-full p-10 rounded-2xl flex flex-col items-start relative overflow-hidden group-hover:bg-[#160d21]/90 transition-colors">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 text-9xl">
                🏪
              </div>
              <div className="flex items-center gap-4 mb-8">
               <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0df259]/10 text-[#0df259] border border-[#0df259]/20 text-3xl">
                  🏪
               </div>
               <div>
                 <span className="px-3 py-1 bg-[#0df259]/20 text-[#0df259] rounded-full text-xs font-bold uppercase tracking-wider border border-[#0df259]/30">Zero Investment</span>
               </div>
              </div>
              <h3 className="text-3xl font-black mb-4 text-white">Mein Dukaandar Hoon</h3>
              <p className="text-slate-400 mb-8 max-w-xs text-lg font-medium leading-relaxed rounded-full">
                Apni dukaan ki khaali jagah se extra kamai shuru karein. Sirf saaman lagao, photo kheencho, aur turant <span className="text-white font-bold">UPI Cash</span> pao.
              </p>
              <div className="mt-auto flex items-center gap-4 w-full justify-between">
                <span className="flex items-center gap-2 px-6 py-3 bg-[#0df259] text-black font-bold rounded-xl shadow-[0_0_20px_rgba(13,242,89,0.3)] group-hover:scale-105 transition-transform">
                  <span className="text-xl">💸</span> Earn ₹500/Day Extra
                </span>
                <span className="text-[#0df259] font-bold text-sm uppercase tracking-wider">Join 50k+ Stores</span>
              </div>
            </div>
          </Link>

          {/* Brand Card */}
          <Link href="/brand/login" className="group relative p-1 rounded-2xl bg-gradient-to-br from-[#8c25f4]/30 to-transparent hover:from-[#8c25f4]/60 transition-all duration-500 block text-left mt-0" style={{ textDecoration: 'none' }}>
             <div className="bg-[#160d21]/80 backdrop-blur-xl border border-[#8c25f4]/20 h-full p-10 rounded-2xl flex flex-col items-start relative overflow-hidden group-hover:bg-[#160d21]/90 transition-colors">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 text-9xl">
                🏢
              </div>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#8c25f4]/10 text-[#8c25f4] border border-[#8c25f4]/20 text-3xl">
                  🏢
                </div>
                <div>
                 <span className="px-3 py-1 bg-[#8c25f4]/20 text-[#8c25f4] rounded-full text-xs font-bold uppercase tracking-wider border border-[#8c25f4]/30">Real-time Visibility</span>
               </div>
              </div>
              <h3 className="text-3xl font-black mb-4 text-white">I am a Brand Owner</h3>
              <p className="text-slate-400 mb-8 max-w-xs text-lg font-medium leading-relaxed">
                Stop wasting trade spend on blind promotions. Deploy AI bots to secure premium shelf visibility and <span className="text-white font-bold">only pay for verified execution.</span>
              </p>
              <div className="mt-auto flex items-center gap-4 w-full justify-between">
                <span className="flex items-center gap-2 px-6 py-3 bg-[#8c25f4] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(140,37,244,0.4)] group-hover:scale-105 transition-transform">
                  <span className="text-xl">🤖</span> Start Bidding Engine
                </span>
                <span className="text-[#8c25f4] font-bold text-sm uppercase tracking-wider">No Retainers</span>
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Value Proposition & How It Works Section */}
      <section className="relative z-10 px-6 py-12 mx-auto max-w-7xl lg:px-12 animate-fadeInUp">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">How It Works</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">A seamless marketplace connecting local retail spaces with global advertising budgets.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Shopkeeper Benefits */}
          <div className="bg-[#160d21]/60 backdrop-blur-md border border-[#0df259]/20 rounded-3xl p-8 lg:p-10 relative overflow-hidden group hover:bg-[#160d21]/80 transition-colors">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#0df259]/10 rounded-full blur-3xl group-hover:bg-[#0df259]/20 transition-colors"></div>
            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <span className="text-[#0df259]">🏪</span> Use Case: Shopkeepers
            </h3>
            <ul className="space-y-8">
              <li className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-[#0df259]/10 text-[#0df259] border border-[#0df259]/30 flex items-center justify-center font-black text-xl shrink-0">1</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Claim High-Paying Tasks</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Open the app to see which brands are bidding for shelf space in your exact area and accept tasks.</p>
                </div>
              </li>
              <li className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-[#0df259]/10 text-[#0df259] border border-[#0df259]/30 flex items-center justify-center font-black text-xl shrink-0">2</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Upload Shelf Photos</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Place the requested products on your premium shelves and snap a quick verification photo using our AI camera.</p>
                </div>
              </li>
              <li className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-[#0df259]/10 text-[#0df259] border border-[#0df259]/30 flex items-center justify-center font-black text-xl shrink-0">3</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Earn Instant Cash</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Once our computer vision AI instantly verifies the placement, earnings are sent straight to your UPI wallet.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Brand Benefits */}
          <div className="bg-[#160d21]/60 backdrop-blur-md border border-[#8c25f4]/20 rounded-3xl p-8 lg:p-10 relative overflow-hidden group hover:bg-[#160d21]/80 transition-colors">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#8c25f4]/10 rounded-full blur-3xl group-hover:bg-[#8c25f4]/20 transition-colors"></div>
            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <span className="text-[#8c25f4]">🏢</span> Use Case: Brands
            </h3>
            <ul className="space-y-8">
              <li className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-[#8c25f4]/10 text-[#8c25f4] border border-[#8c25f4]/30 flex items-center justify-center font-black text-xl shrink-0">1</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Target Micro-Markets</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Launch targeted campaigns in specific pin codes to push new SKUs or counter competitors where it matters most.</p>
                </div>
              </li>
              <li className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-[#8c25f4]/10 text-[#8c25f4] border border-[#8c25f4]/30 flex items-center justify-center font-black text-xl shrink-0">2</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Deploy AI Bidding Agents</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Set your daily budget and let our automated bidding agents secure the best shelf visibility across thousands of stores.</p>
                </div>
              </li>
              <li className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-[#8c25f4]/10 text-[#8c25f4] border border-[#8c25f4]/30 flex items-center justify-center font-black text-xl shrink-0">3</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Pay Per Verified Execution</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Stop paying for unverified retail promotions. You only pay when our AI confirms your product is actually on the shelf.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 py-20 mx-auto max-w-7xl lg:px-12 border-t border-[#8c25f4]/10 animate-fadeInUp animate-fadeInUp-delay-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl lg:text-5xl font-black text-white mb-2">$420M+</div>
            <div className="text-slate-500 text-sm font-bold uppercase tracking-widest">Market Volume</div>
          </div>
          <div className="text-center">
            <div className="text-4xl lg:text-5xl font-black text-white mb-2">1.2M</div>
            <div className="text-slate-500 text-sm font-bold uppercase tracking-widest">Daily Scans</div>
          </div>
          <div className="text-center">
            <div className="text-4xl lg:text-5xl font-black text-white mb-2">98.4%</div>
            <div className="text-slate-500 text-sm font-bold uppercase tracking-widest">AI Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-4xl lg:text-5xl font-black text-white mb-2">12ms</div>
            <div className="text-slate-500 text-sm font-bold uppercase tracking-widest">Bid Latency</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/5 mx-auto max-w-7xl lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <span className="text-2xl text-[#8c25f4]">🏢</span>
            <span className="text-xl font-bold">Shelf-Bidder</span>
          </div>
          <div className="mt-4 text-center text-slate-600 text-xs font-bold tracking-widest uppercase">
            © {new Date().getFullYear()} Shelf-Bidder Technologies. Powered by AI.
          </div>
        </div>
      </footer>
    </div>
  );
}
