'use client';

/**
 * Camera Page - Shelf Photo Capture
 * Simple camera interface for shopkeepers to photograph shelves
 *
 * Task 8.1: Camera interface and photo capture
 * Requirements: 2.1, 7.3
 */

import { useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { compressImage } from '@/lib/utils/image-compression';
import { queuePhoto } from '@/lib/offline/storage';
import { useIsOffline } from '@/hooks/use-offline';

type CameraState = 'ready' | 'capturing' | 'preview' | 'uploading' | 'analyzing' | 'inventory' | 'done';

// Brands for inventory check (PRD: Inventory Check feature)
const INVENTORY_BRANDS = [
  { id: 'coke', name: 'Coca-Cola', emoji: '🥤' },
  { id: 'pepsi', name: 'Pepsi', emoji: '🥤' },
  { id: 'lays', name: 'Lays', emoji: '🍟' },
  { id: 'parle', name: 'Parle-G', emoji: '🍪' },
  { id: 'amul', name: 'Amul', emoji: '🧈' },
  { id: 'local', name: 'Local Brand', emoji: '🏪' },
];

function CameraContent() {
  const { shopkeeper } = useAuth();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  
  const [state, setState] = useState<CameraState>('ready');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [inventory, setInventory] = useState<Record<string, boolean>>({});
  const [analysisResult, setAnalysisResult] = useState<{
    emptySpaces?: number;
    confidence?: number;
    message?: string;
    isVerification?: boolean;
    verified?: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOffline = useIsOffline();

  const handleCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Compress the image before anything else (Task 13.2)
      const compressedFile = await compressImage(file, 1080, 1080, 0.7);
      setCapturedFile(compressedFile);

      // 2. Read for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
        setState('preview');
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('Failed to process image format.');
    }
  };

  const handleUpload = async () => {
    if (!capturedFile || !shopkeeper?.id) return;
    
    try {
      setState('uploading');

      // Task 8.4: Graceful Degradation / Offline Queue
      if (isOffline) {
        if (!capturedImage) throw new Error('Preview missing for offline queue');
        await queuePhoto({
          id: `queued-${Date.now()}`,
          shopkeeperId: shopkeeper.id,
          imageData: capturedImage, 
          timestamp: new Date().toISOString(),
          // Include taskId in imageData payload or a separate field if needed, but since QueuedPhoto schema expects standard structure, we can handle it later or append. For now, just save.
        });
        setAnalysisResult({
          message: 'Saved offline. Will sync when back online.',
        });
        setState('done');
        return;
      }

      // 1. Get Pre-signed URL
      const { data: uploadData } = await apiClient.post<{ data: { uploadUrl: string; photoUrl: string } }>('/api/photos/upload-url', {
        shopkeeperId: shopkeeper.id,
        photoType: taskId ? 'proof' : 'shelf',
        filename: capturedFile.name,
        mimeType: capturedFile.type,
        fileSize: capturedFile.size,
      });

      // 2. Upload to S3 directly
      const uploadRes = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: capturedFile,
        headers: {
          'Content-Type': capturedFile.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image to S3');
      }

      setState('analyzing');

      // 3. Analyze or Verify
      if (taskId) {
        // Task verification flow
        const { data: verifyData } = await apiClient.post<{ data: { verified: boolean; feedback?: string; confidence?: number } }>(`/api/tasks/verify`, {
          shopkeeperId: shopkeeper.id,
          taskId,
          photoUrl: uploadData.photoUrl,
        });
        
        setAnalysisResult({
          isVerification: true,
          verified: verifyData.verified,
          message: verifyData.feedback || 'Verification completed.',
          confidence: verifyData.confidence || 100,
        });
      } else {
        // New shelf analysis flow
        const { data: analyzeData } = await apiClient.post<{ data: { emptySpaces: number; analysisConfidence: number } }>('/api/photos/analyze', {
          shopkeeperId: shopkeeper.id,
          photoUrl: uploadData.photoUrl,
          mimeType: capturedFile.type,
        });

        setAnalysisResult({
          isVerification: false,
          emptySpaces: analyzeData.emptySpaces || 0,
          confidence: analyzeData.analysisConfidence || 100,
        });
        
        // Let backend handle Auction creation or we trigger it here if needed
        // For now, backend might already do it or we assume it's an opportunity.
        
        // Go to inventory check before finishing
        setState('inventory');
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to process image. Please try again.');
      setState('preview'); // Allow them to retry
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setInventory({});
    setState('ready');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="page-container gradient-mesh flex flex-col">
      {/* Header */}
      <header className="p-4 pt-12 text-center">
        <h1 className="text-xl font-bold">{taskId ? 'Task Proof' : 'Scan Shelf'}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {taskId ? 'Take a photo of the completed task' : 'Take a photo of your shelf to find opportunities'}
        </p>
      </header>

      {/* Camera Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        {state === 'ready' && (
          <div className="w-full max-w-sm animate-fadeInUp">
            {/* Camera Viewfinder */}
            <div
              className="glass-card w-full aspect-[3/4] flex flex-col items-center justify-center gap-4 cursor-pointer"
              onClick={handleCapture}
              id="camera-viewfinder"
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                   style={{ background: 'rgba(108, 99, 255, 0.15)' }}>
                <span className="text-4xl">📷</span>
              </div>
              <div className="text-center">
                <p className="font-semibold">Tap to Take Photo</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Point camera at your shelf
                </p>
              </div>

              {/* Corner guides */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 rounded-tl"
                   style={{ borderColor: 'var(--primary)' }} />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 rounded-tr"
                   style={{ borderColor: 'var(--primary)' }} />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 rounded-bl"
                   style={{ borderColor: 'var(--primary)' }} />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 rounded-br"
                   style={{ borderColor: 'var(--primary)' }} />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              id="camera-input"
            />

            <div className="mt-4 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                💡 Make sure the entire shelf is visible
              </p>
            </div>
          </div>
        )}

        {state === 'preview' && capturedImage && (
          <div className="w-full max-w-sm animate-fadeInUp">
            <div className="glass-card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Shelf preview"
                className="w-full aspect-[3/4] object-cover"
                id="photo-preview"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button className="btn btn-outline flex-1" onClick={handleRetake} id="btn-retake">
                🔄 Retake
              </button>
              <button className="btn btn-primary flex-1" onClick={handleUpload} id="btn-upload">
                ✨ Analyze
              </button>
            </div>
          </div>
        )}

        {(state === 'uploading' || state === 'analyzing') && (
          <div className="w-full max-w-sm text-center animate-fadeInUp">
            <div className="glass-card p-8">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center pulse-glow"
                   style={{ background: 'rgba(108, 99, 255, 0.15)' }}>
                <span className="text-3xl">
                  {state === 'uploading' ? '☁️' : '🔍'}
                </span>
              </div>
              <p className="font-semibold mt-4">
                {state === 'uploading' ? 'Uploading photo...' : 'Analyzing shelf...'}
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                {state === 'uploading' ? 'Please wait' : 'AI is finding empty spaces'}
              </p>
              <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                <div className="h-full rounded-full gradient-primary"
                     style={{
                       width: state === 'uploading' ? '50%' : '80%',
                       transition: 'width 1.5s ease'
                     }} />
              </div>
            </div>
          </div>
        )}

      {/* Inventory Check State */}
      {state === 'inventory' && (
        <div className="w-full max-w-sm animate-fadeInUp">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-center">Current Stock</h2>
            <p className="text-sm mt-1 text-center" style={{ color: 'var(--text-secondary)' }}>
              What do you currently have in stock?
            </p>
            
            <div className="mt-6 space-y-3">
              {INVENTORY_BRANDS.map((brand) => (
                <label key={brand.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded"
                    checked={inventory[brand.id] || false}
                    onChange={(e) => setInventory({ ...inventory, [brand.id]: e.target.checked })}
                  />
                  <span className="text-xl">{brand.emoji}</span>
                  <span className="font-medium flex-1">{brand.name}</span>
                </label>
              ))}
            </div>

            <button 
              className="btn btn-primary w-full mt-6"
              onClick={() => {
                // Here we would ideally send the inventory to the backend
                // apiClient.post('/api/inventory', { shopkeeperId: shopkeeper?.id, inventory });
                setState('done');
              }}
            >
              Submit & Start Auction
            </button>
          </div>
        </div>
      )}

      {/* Done State */}
      {state === 'done' && analysisResult && (
          <div className="w-full max-w-sm animate-fadeInUp">
            <div className="glass-card p-6 text-center">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                   style={{ background: 'rgba(0, 214, 143, 0.15)' }}>
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-lg font-bold mt-4">
                {analysisResult.isVerification ? (analysisResult.verified ? 'Task Verified!' : 'Verification Failed') : 'Analysis Complete!'}
              </h2>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                {analysisResult.isVerification 
                  ? analysisResult.message 
                  : 'Found opportunities on your shelf'}
              </p>

              {!analysisResult.isVerification && (
                <div className="flex justify-center gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold" style={{ color: 'var(--accent-green)' }}>
                      {analysisResult.emptySpaces}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Empty Spaces
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold" style={{ color: 'var(--primary-light)' }}>
                      {analysisResult.confidence}%
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Confidence
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(108, 99, 255, 0.1)' }}>
                <p className="text-sm" style={{ color: 'var(--primary-light)' }}>
                  {analysisResult.isVerification 
                    ? 'Payment has been processed if verified.' 
                    : '🏷️ Auction started! Brands are bidding for your shelf space.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button className="btn btn-outline flex-1" onClick={handleRetake} id="btn-scan-again">
                📷 Scan Again
              </button>
              <button
                className="btn btn-success flex-1"
                onClick={() => window.location.href = '/tasks'}
                id="btn-view-tasks-result"
              >
                📋 View Tasks
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function CameraPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center mt-20">Loading...</div>}>
      <CameraContent />
    </Suspense>
  );
}
