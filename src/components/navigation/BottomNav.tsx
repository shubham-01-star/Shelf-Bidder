'use client';

/**
 * Bottom Navigation Bar — Stitch Design
 * Material Symbols Outlined icons, light background, kirana-green active state
 * Task 8: Frontend PWA Implementation
 */

import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { path: '/dashboard', label: 'Home',    icon: 'home',                  iconFilled: 'home'                  },
  { path: '/tasks',     label: 'Tasks',   icon: 'task_alt',              iconFilled: 'task_alt'              },
  { path: '/wallet',   label: 'Wallet',   icon: 'account_balance_wallet', iconFilled: 'account_balance_wallet' },
  { path: '/profile',  label: 'Profile',  icon: 'person',                iconFilled: 'person'                },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      className="bottom-nav"
      id="bottom-navigation"
      style={{ fontFamily: "'Lexend', sans-serif" }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <button
            key={item.path}
            id={`nav-${item.label.toLowerCase()}`}
            className={`nav-item${isActive ? ' active' : ''}`}
            onClick={() => router.push(item.path)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span
              className="material-symbols-outlined nav-icon"
              style={{
                fontVariationSettings: isActive
                  ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
                  : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                fontSize: '28px',
              }}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
