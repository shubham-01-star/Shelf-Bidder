import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import { validateEnv } from '@/lib/config/env-validator';

validateEnv();

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Shelf-Bidder',
  description: 'Autonomous Retail Ad-Network - Transform your shelf space into revenue',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shelf-Bidder',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#11d452',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Material Symbols Outlined — used by BottomNav and all pages */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body 
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background-light dark:bg-background-dark text-text-main dark:text-gray-100 min-h-screen`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <OfflineIndicator />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
