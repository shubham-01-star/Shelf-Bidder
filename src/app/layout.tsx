import type { Metadata, Viewport } from 'next';
import { Lexend, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import { validateEnv } from '@/lib/config/env-validator';

validateEnv();

const lexend = Lexend({ 
  subsets: ['latin'], 
  variable: '--font-lexend',
  display: 'swap',
});
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  variable: '--font-space',
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
      <body className={`${lexend.variable} ${spaceGrotesk.variable} antialiased`}>
        <AuthProvider>
          <OfflineIndicator />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
