'use client';

/**
 * Landing Page — Role Selection
 * User chooses between Shopkeeper and Brand Owner
 */

export default function Home() {
  return (
    <div className="page-container gradient-mesh flex flex-col items-center justify-center p-4 min-h-screen">
      <div className="w-full" style={{ maxWidth: '400px' }}>

        {/* Logo */}
        <div className="text-center mb-10 animate-fadeInUp">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4"
               style={{ fontSize: '40px', boxShadow: '0 8px 32px rgba(108, 99, 255, 0.4)' }}>
            🏪
          </div>
          <h1 className="text-3xl font-extrabold">Shelf-Bidder</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Earn money from your shelf space
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-4 animate-fadeInUp animate-fadeInUp-delay-1">
          <p className="text-center text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            I am a...
          </p>

          {/* Shopkeeper Card */}
          <a href="/signin" className="glass-card p-5 flex items-center gap-4 cursor-pointer block" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(0, 214, 143, 0.15)', fontSize: '28px' }}>
              🏪
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">Shopkeeper</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Scan shelves, complete tasks, earn money
              </p>
            </div>
            <span className="text-lg" style={{ color: 'var(--text-muted)' }}>→</span>
          </a>

          {/* Brand Owner Card */}
          <a href="/brand/login" className="glass-card p-5 flex items-center gap-4 cursor-pointer block" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(108, 99, 255, 0.15)', fontSize: '28px' }}>
              🏢
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">Brand Owner</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Bid on shelf space, promote products
              </p>
            </div>
            <span className="text-lg" style={{ color: 'var(--text-muted)' }}>→</span>
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-8 animate-fadeInUp animate-fadeInUp-delay-2"
           style={{ color: 'var(--text-muted)' }}>
          AI-powered shelf space marketplace
        </p>
      </div>
    </div>
  );
}
