'use client';

/**
 * Camera Page - Shelf Photo Capture
 * Simple camera interface for shopkeepers to photograph shelves
 *
 * Task 8.1: Camera interface and photo capture
 * Requirements: 2.1, 7.3
 */

import { useState, useRef, useCallback } from 'react';
import BottomNav from '@/components/navigation/BottomNav';

type CameraState = 'ready' | 'capturing' | 'preview' | 'uploading' | 'analyzing' | 'done';

export default function CameraPage() {
  const [state, setState] = useState<CameraState>('ready');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    emptySpaces: number;
    confidence: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      setState('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    setState('uploading');

    // Simulate upload delay
    await new Promise((r) => setTimeout(r, 1500));
    setState('analyzing');

    // Simulate analysis
    await new Promise((r) => setTimeout(r, 2000));
    setAnalysisResult({ emptySpaces: 3, confidence: 94.5 });
    setState('done');
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setState('ready');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="page-container gradient-mesh flex flex-col">
      {/* Header */}
      <header className="p-4 pt-12 text-center">
        <h1 className="text-xl font-bold">Scan Shelf</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Take a photo of your shelf to find opportunities
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

        {state === 'done' && analysisResult && (
          <div className="w-full max-w-sm animate-fadeInUp">
            <div className="glass-card p-6 text-center">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                   style={{ background: 'rgba(0, 214, 143, 0.15)' }}>
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-lg font-bold mt-4">Analysis Complete!</h2>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                Found opportunities on your shelf
              </p>

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

              <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(108, 99, 255, 0.1)' }}>
                <p className="text-sm" style={{ color: 'var(--primary-light)' }}>
                  🏷️ Auction started! Brands are bidding for your shelf space.
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
