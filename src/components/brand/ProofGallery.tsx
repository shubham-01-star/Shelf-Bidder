'use client';

/**
 * Proof Gallery Component
 * Feature: brand-dashboard-redesign
 * Task: 14.1 Create proof photo grid
 * Task: 14.2 Implement lazy image loading
 * 
 * Displays verified proof photos from shopkeepers with AI verification badges
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProofPhoto {
  id: string;
  photoUrl: string;
  productName: string;
  brandName: string;
  timestamp: string;
  payoutAmount: number;
  verified: boolean;
  verificationMethod: 'Amazon Bedrock' | 'Manual';
}

export default function ProofGallery() {
  const [photos, setPhotos] = useState<ProofPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProofPhotos = async () => {
      try {
        setLoading(true);
        
        // Mock data for now - replace with actual API call
        const mockPhotos: ProofPhoto[] = [
          {
            id: '1',
            photoUrl: 'https://via.placeholder.com/400x300',
            productName: 'Diet Coke 330ml',
            brandName: 'Coca-Cola',
            timestamp: new Date().toISOString(),
            payoutAmount: 100,
            verified: true,
            verificationMethod: 'Amazon Bedrock',
          },
          {
            id: '2',
            photoUrl: 'https://via.placeholder.com/400x300',
            productName: 'Lays Classic 50g',
            brandName: 'PepsiCo',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            payoutAmount: 75,
            verified: true,
            verificationMethod: 'Amazon Bedrock',
          },
        ];

        // Sort in reverse chronological order
        const sorted = mockPhotos.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setPhotos(sorted);
      } catch (err) {
        console.error('Failed to fetch proof photos:', err);
        setError('Failed to load proof photos');
      } finally {
        setLoading(false);
      }
    };

    loadProofPhotos();
  }, []);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Reload photos
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff5c61]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#64748b] mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="bg-[#ff5c61] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#ff4a50] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 text-6xl">📸</div>
        <p className="text-[#1e293b] font-semibold mb-2">No Proof Photos Yet</p>
        <p className="text-[#64748b] text-sm">
          Verified proof photos from shopkeepers will appear here once campaigns are completed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="bg-white rounded-[1.5rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:scale-105 transition-all duration-300"
        >
          {/* Photo */}
          <div className="relative aspect-[4/3] bg-gray-100">
            <img
              src={photo.photoUrl}
              alt={photo.productName}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            
            {/* Verification Badge */}
            {photo.verified && (
              <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                <span>✓</span>
                <span>Verified by AI</span>
              </div>
            )}
          </div>

          {/* Photo Metadata */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-2">
              {photo.productName}
            </h3>
            
            <div className="flex items-center justify-between text-xs text-[#64748b] mb-2">
              <span>{formatDate(photo.timestamp)}</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(photo.payoutAmount)}
              </span>
            </div>

            {photo.verified && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-[#64748b]">
                  Verified by <span className="font-semibold text-[#1e293b]">{photo.verificationMethod}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
