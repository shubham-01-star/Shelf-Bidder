'use client';

/**
 * Camera Page - Shelf Photo Capture
 * Simple camera interface for shopkeepers to photograph shelves
 *
 * Task 8.1: Camera interface and photo capture
 * Requirements: 2.1, 7.3
 */

import { useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { compressImage } from '@/lib/utils/image-compression';
import { queuePhoto } from '@/lib/offline/storage';
import { useIsOffline } from '@/hooks/use-offline';
import { ChevronLeft, Zap, Grid, Image as ImageIcon, History, Camera as CameraIcon, Check, X, RefreshCw, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

type CameraState = 'ready' | 'capturing' | 'preview' | 'uploading' | 'analyzing' | 'inventory' | 'done';

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
  const router = useRouter();
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
      const compressedFile = await compressImage(file, 1080, 1080, 0.7);
      setCapturedFile(compressedFile);

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

      if (isOffline) {
        if (!capturedImage) throw new Error('Preview missing for offline queue');
        await queuePhoto({
          id: `queued-${Date.now()}`,
          shopkeeperId: shopkeeper.id,
          imageData: capturedImage, 
          timestamp: new Date().toISOString(),
        });
        setAnalysisResult({
          message: 'Saved offline. Will sync when back online.',
        });
        setState('done');
        return;
      }

      const { data: uploadData } = await apiClient.post<{ data: { uploadUrl: string; photoUrl: string } }>('/api/photos/upload-url', {
        shopkeeperId: shopkeeper.id,
        photoType: taskId ? 'proof' : 'shelf',
        filename: capturedFile.name,
        mimeType: capturedFile.type,
        fileSize: capturedFile.size,
      });

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

      if (taskId) {
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
        setState('done');
      } else {
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
        
        setState('inventory');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to process image. Please try again.');
      setState('preview');
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
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-white text-[#1a1c1e] font-sans antialiased">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Half: Viewfinder or Preview */}
      <div 
        className="relative h-[68%] w-full bg-slate-900 bg-cover bg-center transition-all duration-300"
        style={{
          backgroundImage: capturedImage 
            ? `url(${capturedImage})` 
            : 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuA3l8ZeAV8ebZ788HlmorfKUnX80Azy_Veki0-9npFiQZT-1PYRICyIzwuIGM1KkkOI4YMRYriXHvTsgVNJmFPyPn765fJDRDKg2rn3IiBjqwfR68G9PlrZ76vqARkc11Dg34HeCzZBsPw9bp7ZFJKiCM2FjtzXcqJIxAZ8chRAhZuFSmwVIVe2soh-yhfXZz8TfLGauUxjzh7xYeUG1cD3COKovzKyUG_NudE9mf_RwzDfT8GXseaAOIxIKQ6GJ6IdR5eNmU61A3M)'
        }}
      >
        <div className="h-12 w-full"></div> {/* Status bar spacer */}
        
        <div className="absolute top-0 left-0 right-0 flex items-center p-5 bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={() => router.back()} className="flex items-center justify-center rounded-xl w-10 h-10 bg-white/20 backdrop-blur-md text-white border border-white/30 active:scale-95 transition-transform">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="ml-4">
            <h1 className="text-white font-semibold text-lg">{taskId ? 'Task Proof' : 'Shelf Scan'}</h1>
            <p className="text-white/80 text-xs font-light">{taskId ? 'Verify Completion' : 'Inventory Audit Mode'}</p>
          </div>
        </div>

        {/* Viewfinder Overlay */}
        {(state === 'ready' || state === 'uploading' || state === 'analyzing') && (
          <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none z-10">
            <div className={`w-full h-full border-2 border-white/50 border-dashed rounded-[1.25rem] flex flex-col items-center justify-center transition-all duration-1000 ${
              (state === 'uploading' || state === 'analyzing') ? 'border-[#11d452] bg-[#11d452]/20 scale-105 animate-pulse' : ''
            }`}>
              {state === 'ready' && (
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                  <p className="text-white text-xs font-medium">Position product in frame</p>
                </div>
              )}
              {state === 'uploading' && (
                <div className="bg-black/60 backdrop-blur-md p-4 rounded-full flex flex-col items-center gap-2 border border-[#11d452]/50">
                   <UploadCloud className="w-8 h-8 text-[#11d452] animate-bounce" />
                   <p className="text-white text-xs font-bold">Uploading...</p>
                </div>
              )}
              {state === 'analyzing' && (
                <div className="bg-black/60 backdrop-blur-md p-4 rounded-full flex flex-col items-center gap-2 border border-[#11d452]/50">
                   <RefreshCw className="w-8 h-8 text-[#11d452] animate-spin" />
                   <p className="text-white text-xs font-bold">AI Analyzing...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {state === 'ready' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
            <button className="flex items-center justify-center rounded-xl w-11 h-11 bg-black/30 backdrop-blur-md text-white border border-white/10 active:bg-white/20 transition-colors">
              <Zap className="w-5 h-5" />
            </button>
            <button className="flex items-center justify-center rounded-xl w-11 h-11 bg-black/30 backdrop-blur-md text-white border border-white/10 active:bg-white/20 transition-colors">
              <Grid className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Half: Controls & Context */}
      <div className="relative flex-1 flex flex-col bg-white -mt-6 rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-20 px-6 pt-6 overflow-y-auto">
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 shrink-0"></div>
        
        <div className="flex flex-col flex-1 pb-8 animate-fadeInUp">
          
          {/* READY STATE */}
          {state === 'ready' && (
            <>
              <div className="text-center mb-6">
                <span className="inline-block px-3 py-1 bg-[#11d452]/10 text-[#11d452] text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">Camera</span>
                <h2 className="text-[#1a1c1e] text-xl font-bold">Capture the whole shelf</h2>
              </div>
              
              <div className="mt-auto flex items-center justify-between">
                <button className="flex flex-col items-center gap-1.5 group">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-active:bg-slate-100 transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">ALBUM</span>
                </button>
                
                <div className="relative" onClick={handleCapture}>
                  <div className="absolute -inset-2.5 border-2 border-[#11d452]/20 rounded-full"></div>
                  <button className="relative flex items-center justify-center rounded-full w-20 h-20 bg-[#11d452] text-white shadow-[0_8px_20px_rgba(17,212,82,0.4)] active:scale-90 transition-all">
                    <div className="w-[68px] h-[68px] border-2 border-white/30 rounded-full flex items-center justify-center">
                      <CameraIcon className="w-8 h-8" fill="currentColor" />
                    </div>
                  </button>
                </div>
                
                <button className="flex flex-col items-center gap-1.5 group">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-active:bg-slate-100 transition-colors">
                    <History className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">LOGS</span>
                </button>
              </div>
            </>
          )}

          {/* PREVIEW STATE */}
          {state === 'preview' && (
            <>
              <div className="text-center mb-6">
                <span className="inline-block px-3 py-1 bg-[#11d452]/10 text-[#11d452] text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">Confirm Photo</span>
                <h2 className="text-[#1a1c1e] text-xl font-bold">Looks good?</h2>
              </div>
              <div className="mt-auto flex w-full gap-4">
                <button 
                  onClick={handleRetake}
                  className="flex-1 flex flex-col items-center justify-center gap-2 bg-slate-100 py-4 rounded-xl text-slate-600 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-6 h-6" />
                  <span className="text-sm font-bold">Retake</span>
                </button>
                <button 
                  onClick={handleUpload}
                  className="flex-[2] flex items-center justify-center gap-3 bg-[#11d452] py-4 rounded-xl text-white shadow-lg shadow-[#11d452]/30 active:scale-95 transition-all"
                >
                  <span className="text-lg font-bold">Analyze Photo</span>
                  <Check className="w-6 h-6 stroke-[3]" />
                </button>
              </div>
            </>
          )}

          {/* UPLOADING / ANALYZING STATE */}
          {(state === 'uploading' || state === 'analyzing') && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
               <h2 className="text-[#1a1c1e] text-2xl font-bold">{state === 'uploading' ? 'Uploading...' : 'AI Analyzing...'}</h2>
               <p className="text-slate-500 mt-2">{state === 'uploading' ? 'Securely sending photo' : 'Detecting shelf space and products'}</p>
               <div className="w-full max-w-[200px] h-2 bg-slate-100 rounded-full mt-8 overflow-hidden">
                 <div className="h-full bg-[#11d452] rounded-full transition-all duration-700 w-2/3 animate-pulse"></div>
               </div>
            </div>
          )}

          {/* INVENTORY STATE */}
          {state === 'inventory' && (
            <>
              <div className="text-center mb-6 shrink-0">
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">Live Verification</span>
                <h2 className="text-[#1a1c1e] text-xl font-bold">What's in stock right now?</h2>
              </div>
              
              <div className="space-y-3 mb-8">
                {INVENTORY_BRANDS.map((brand) => (
                  <label key={brand.id} className="flex items-center gap-4 p-4 rounded-xl cursor-pointer bg-slate-50 border border-slate-100 hover:border-[#11d452]/50 transition-colors shadow-sm">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded text-[#11d452] focus:ring-[#11d452]"
                      checked={inventory[brand.id] || false}
                      onChange={(e) => setInventory({ ...inventory, [brand.id]: e.target.checked })}
                    />
                    <span className="text-2xl">{brand.emoji}</span>
                    <span className="font-bold flex-1 text-slate-700">{brand.name}</span>
                  </label>
                ))}
              </div>

              <div className="mt-auto">
                <button 
                  onClick={() => setState('done')}
                  className="w-full flex items-center justify-center gap-3 bg-[#11d452] py-4 rounded-xl text-white shadow-lg shadow-[#11d452]/30 active:scale-95 transition-all text-lg font-bold"
                >
                  Submit Inventory
                </button>
              </div>
            </>
          )}

          {/* DONE STATE */}
          {state === 'done' && analysisResult && (
             <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  {analysisResult.isVerification ? (analysisResult.verified ? <CheckCircle2 className="w-10 h-10 text-green-600" /> : <AlertCircle className="w-10 h-10 text-red-600" />) : <CheckCircle2 className="w-10 h-10 text-green-600" />}
                </div>
                
                <h2 className="text-[#1a1c1e] text-2xl font-bold mb-2">
                  {analysisResult.isVerification ? (analysisResult.verified ? 'Task Verified!' : 'Verification Failed') : 'Analysis Complete!'}
                </h2>
                <p className="text-slate-500 mb-8">
                  {analysisResult.isVerification 
                    ? analysisResult.message 
                    : 'We found opportunities on your shelf.'}
                </p>

                {!analysisResult.isVerification && (
                  <div className="flex justify-center gap-8 w-full mb-8">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-extrabold text-[#11d452]">{analysisResult.emptySpaces}</span>
                      <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Gaps Found</span>
                    </div>
                    <div className="w-px h-12 bg-slate-200"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-extrabold text-[#8c25f4]">{analysisResult.confidence}%</span>
                      <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Confidence</span>
                    </div>
                  </div>
                )}

                <div className="mt-auto w-full flex gap-4">
                  <button 
                    onClick={handleRetake}
                    className="flex-1 bg-slate-100 py-4 rounded-xl text-slate-700 font-bold active:bg-slate-200 transition-colors"
                  >
                    Scan Another
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 bg-[#11d452] py-4 rounded-xl text-white shadow-lg shadow-[#11d452]/30 font-bold active:scale-95 transition-transform"
                  >
                    Back to Home
                  </button>
                </div>
             </div>
          )}

        </div>
      </div>
      
      {/* Safety indicator for edge swipes */}
      <div className="bg-white flex justify-center pb-2 z-20">
        <div className="w-32 h-1.5 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  );
}

export default function CameraPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center mt-20 font-sans font-medium text-slate-500">Loading camera...</div>}>
      <CameraContent />
    </Suspense>
  );
}
