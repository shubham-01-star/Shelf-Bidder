'use client';

/**
 * Bottom Navigation Bar
 * Mobile-first navigation for the PWA
 * Task 8: Frontend PWA Implementation
 */

import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: '🏠' },
  { path: '/camera', label: 'Scan', icon: '📷' },
  { path: '/tasks', label: 'Tasks', icon: '📋' },
  { path: '/wallet', label: 'Wallet', icon: '💰' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="bottom-nav" id="bottom-navigation">
      {navItems.map((item) => (
        <button
          key={item.path}
          id={`nav-${item.label.toLowerCase()}`}
          className={`nav-item ${pathname === item.path ? 'active' : ''}`}
          onClick={() => router.push(item.path)}
          aria-label={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
