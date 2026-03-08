'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type ShelfType = 'eye-level' | 'counter-top' | 'entrance' | 'end-cap';

interface ImageSearchItem {
  id: string;
  title: string;
  location: string;
  shelfType: ShelfType;
  imageUrl: string;
  alt: string;
  estimatedDailyPrice: number;
  rating: number;
  isLive: boolean;
}

interface ImageSearchResponse {
  success: boolean;
  data: {
    count: number;
    results: ImageSearchItem[];
  };
  error?: string;
}

const shelfTypeLabels: Record<ShelfType, string> = {
  'eye-level': 'Eye-Level',
  'counter-top': 'Counter Top',
  entrance: 'Entrance',
  'end-cap': 'End Cap',
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const location = (searchParams.get('location') || 'Gurgaon').trim();
  const shelfType = (searchParams.get('shelfType') || 'eye-level') as ShelfType;

  const [results, setResults] = useState<ImageSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    return new URLSearchParams({
      location,
      shelfType,
      limit: '20',
    }).toString();
  }, [location, shelfType]);

  useEffect(() => {
    let mounted = true;

    async function fetchResults() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/images/search?${queryString}`);
        const data: ImageSearchResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch image search results');
        }

        if (mounted) {
          setResults(data.data.results);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unexpected error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchResults();

    return () => {
      mounted = false;
    };
  }, [queryString]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-main dark:text-gray-100 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Image Search Results</h1>
            <p className="text-sm text-text-sub mt-1">
              Location: <span className="font-semibold">{location}</span> | Shelf Type:{' '}
              <span className="font-semibold">{shelfTypeLabels[shelfType] || shelfType}</span>
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Back
          </Link>
        </div>

        {loading && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark p-6 text-sm">
            Loading results...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark p-6 text-sm">
            No images found for this filter.
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item) => (
              <article key={item.id} className="group cursor-pointer">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-gray-100 shadow-lg">
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-text-main dark:text-white z-10 shadow-sm flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${item.isLive ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
                    {item.isLive ? 'Live Auction' : 'Inactive'}
                  </div>
                  <div className="absolute top-3 right-3 z-10 bg-black/30 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    {shelfTypeLabels[item.shelfType]}
                  </div>
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    role="img"
                    aria-label={item.alt}
                    style={{ backgroundImage: `url('${item.imageUrl}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-bold text-text-main dark:text-white text-lg">{item.title}</h2>
                    <p className="text-text-sub text-sm">{item.location}</p>
                    <p className="text-text-sub text-sm mt-1">
                      Visibility: <span className="font-medium text-text-main dark:text-white">{shelfTypeLabels[item.shelfType]}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">
                      INR {item.estimatedDailyPrice}
                      <span className="text-sm text-text-sub font-normal"> /day</span>
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-1 text-xs font-medium text-text-sub">
                      <span className="material-symbols-outlined text-[14px]">star</span> {item.rating}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
