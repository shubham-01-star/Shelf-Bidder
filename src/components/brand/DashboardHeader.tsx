'use client';

/**
 * Brand Dashboard Header Component
 * Feature: brand-dashboard-redesign
 * Task: 5.1 Build header with greeting, brand name, and avatar
 * 
 * Requirements: 9N.2, 9N.3, 9N.4, 9N.5
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardHeaderProps {
  className?: string;
}

/**
 * Get time-based greeting message
 * Morning: 0-11, Afternoon: 12-16, Evening: 17-23
 */
export function getGreeting(hour?: number): string {
  const currentHour = hour ?? new Date().getHours();
  
  if (currentHour < 12) {
    return 'Good Morning';
  } else if (currentHour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
}

/**
 * Dashboard header with greeting, brand name, and profile avatar
 */
export default function DashboardHeader({ className = '' }: DashboardHeaderProps) {
  const router = useRouter();
  const [brandName, setBrandName] = useState<string>('Brand');
  const [greeting, setGreeting] = useState<string>('');

  useEffect(() => {
    // Get brand name from localStorage
    if (typeof window !== 'undefined') {
      const storedBrandName = localStorage.getItem('brandName');
      if (storedBrandName) {
        setBrandName(storedBrandName);
      }
    }

    // Set greeting based on current time
    setGreeting(getGreeting());
  }, []);

  const handleAvatarClick = () => {
    router.push('/brand/login');
  };

  const avatarLetter = brandName.charAt(0).toUpperCase();

  return (
    <header 
      className={`px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-sm border-b border-gray-200/50 ${className}`}
    >
      {/* Greeting and Brand Name */}
      <div className="flex flex-col">
        <p className="text-sm font-medium text-[#64748b] flex items-center gap-2">
          {greeting}
          <span className="inline-block">👋</span>
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1e293b] mt-1">
          {brandName}
        </h1>
      </div>

      {/* Profile Avatar */}
      <button
        onClick={handleAvatarClick}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff5c61] to-[#ff8a8e] 
                   flex items-center justify-center text-white font-bold text-lg
                   hover:shadow-lg hover:scale-105 transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-[#ff5c61] focus:ring-offset-2"
        aria-label="Go to login page"
      >
        {avatarLetter}
      </button>
    </header>
  );
}
