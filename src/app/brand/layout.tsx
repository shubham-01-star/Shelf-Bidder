'use client';

/**
 * Brand Portal Layout
 * Separate layout for brand owners with blue/purple theme
 */

import { usePathname } from 'next/navigation';

function BrandNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/brand', icon: '📊', label: 'Dashboard' },
    { href: '/brand/products', icon: '📦', label: 'Products' },
    { href: '/brand/auctions', icon: '🏷️', label: 'Auctions' },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex justify-around p-2 pb-safe z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all ${
              isActive ? 'bg-[var(--brand-violet)]/20 text-[var(--brand-violet)]' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
          </a>
        );
      })}
      <a 
        href="/brand/login" 
        className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all ${
          pathname === '/brand/login' ? 'bg-[var(--brand-violet)]/20 text-[var(--brand-violet)]' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span className="text-xl mb-1">👤</span>
        <span className="text-[10px] font-bold tracking-wide">Account</span>
      </a>
    </nav>
  );
}

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark bg-slate-950 text-slate-100 min-h-screen font-brand selection:bg-[var(--brand-violet)] selection:text-white pb-24">
      {children}
      <BrandNav />
    </div>
  );
}
