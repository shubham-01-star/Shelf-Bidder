import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is currently offline.
 * Uses navigator.onLine and listens to 'online' and 'offline' window events.
 */
export function useIsOffline() {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof window !== 'undefined') {
      return !navigator.onLine;
    }
    return false;
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}
