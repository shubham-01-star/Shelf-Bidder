'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (e.g., Sentry)
      console.error('Application error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          कुछ गलत हो गया
        </h2>
        <p className="text-gray-600 mb-6">
          हम इस समस्या को ठीक करने की कोशिश कर रहे हैं।
        </p>
        <button
          onClick={reset}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          फिर से कोशिश करें
        </button>
      </div>
    </div>
  );
}
