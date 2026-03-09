'use client';

/**
 * Offline Status Indicator
 * Shows a banner when the user is offline and sync status.
 *
 * Task 8.4: PWA offline capabilities
 * Requirements: 7.2, 7.3
 */

import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      // Show "back online" briefly
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for queued items periodically
  useEffect(() => {
    const checkQueue = async () => {
      try {
        const { getQueueLength } = await import('@/lib/offline/storage');
        const count = await getQueueLength();
        setSyncCount(count);
      } catch {
        // IndexedDB not available
      }
    };

    checkQueue();
    const interval = setInterval(checkQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!showBanner && !isOffline && syncCount === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300"
      style={{
        background: isOffline
          ? 'linear-gradient(135deg, #FF6B6B, #E17055)'
          : syncCount > 0
            ? 'linear-gradient(135deg, #FFAA00, #E17055)'
            : 'linear-gradient(135deg, #00D68F, #00B894)',
      }}
      id="offline-indicator"
    >
      {isOffline ? (
        <span>📡 You are offline — photos will be saved and synced later</span>
      ) : syncCount > 0 ? (
        <span>🔄 Syncing {syncCount} queued photo{syncCount > 1 ? 's' : ''}...</span>
      ) : (
        <span>✅ Back online!</span>
      )}
    </div>
  );
}
