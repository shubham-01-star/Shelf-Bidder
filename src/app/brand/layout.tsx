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
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={`nav-item ${pathname === item.href ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </a>
      ))}
      <a href="/brand/login" className="nav-item">
        <span className="nav-icon">👤</span>
        <span>Account</span>
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
    <div className="brand-portal">
      {children}
      <BrandNav />
    </div>
  );
}
