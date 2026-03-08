'use client';

/**
 * Camera Page - Shelf Photo Capture
 * Simple camera interface for shopkeepers to photograph shelves
 *
 * Task 8.1: Camera interface and photo capture
 * Requirements: 2.1, 7.3
 */

import { useState, useRef, useCallback, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { compressImage } from '@/lib/utils/image-compression';
import { queuePhoto } from '@/lib/offline/storage';
import { useIsOffline } from '@/hooks/use-offline';
import { extractCityFromAddress } from '@/lib/utils/location';
import { ChevronLeft, Zap, Grid, Image as ImageIcon, History, Camera as CameraIcon, Check, X, RefreshCw, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

type CameraState = 'ready' | 'capturing' | 'preview' | 'uploading' | 'analyzing' | 'offer' | 'done';

// Type for analysis result
interface AnalysisResult {
  emptySpaces: number;
  currentInventory: any[];
  analysisConfidence: number;
  shelfSpaceId?: string;
  isVerification?: boolean;
  verified?: boolean;
  message?: string;
  confidence?: number;
}

// Type for matched campaign
interface MatchedCampaign {
  id: string;
  brandName: string;
  productName: string;
  earnings: number;
  taskId: string;
}

function CameraContent() {
  const { shopkeeper: authShopkeeper, tokens } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskId = searchParams.get('taskId');
  
  // Fetch full shopkeeper data from API (includes store_address)
  const [shopkeeper, setShopkeeper] = useState<any>(authShopkeeper);
  
  // Fetch fresh shopkeeper data on mount
  useEffect(() => {
    const fetchShopkeeper = async () => {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (tokens?.accessToken) {
          headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        }
        
        const response = await fetch('/api/profile', { headers });
        if (response.ok) {
          const data = await response.json();
          setShopkeeper(data.data);
          console.log('[Camera] ✅ Fetched shopkeeper data:', data.data);
          console.log('[Camera] 📍 Store address:', data.data.store_address);
        } else {
          console.error('[Camera] ❌ Failed to fetch shopkeeper, status:', response.status);
          setShopkeeper(authShopkeeper);
        }
      } catch (error) {
        console.error('[Camera] ❌ Failed to fetch shopkeeper:', error);
        // Fallback to auth shopkeeper
        setShopkeeper(authShopkeeper);
      }
    };
    
    if (authShopkeeper && tokens?.accessToken) {
      fetchShopkeeper();
    } else {
      setShopkeeper(authShopkeeper);
    }
  }, [authShopkeeper, tokens]);
  
  const [state, setState] = useState<CameraState>('ready');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [matchedCampaign, setMatchedCampaign] = useState<MatchedCampaign | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
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
          emptySpaces: 0,
          currentInventory: [],
          analysisConfidence: 0,
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
          afterPhotoUrl: uploadData.photoUrl,
          mimeType: capturedFile.type,
        });
        
        setAnalysisResult({
          emptySpaces: 0,
          currentInventory: [],
          analysisConfidence: 0,
          isVerification: true,
          verified: verifyData.verified,
          message: verifyData.feedback || 'Verification completed.',
          confidence: verifyData.confidence || 100,
        });
        setState('done');
      } else {
        const { data: analyzeData } = await apiClient.post<{ data: { id: string; emptySpaces: any[]; analysisConfidence: number; currentInventory: any[] } }>('/api/photos/analyze', {
          shopkeeperId: shopkeeper.shopkeeper_id,
          photoUrl: uploadData.photoUrl,
          mimeType: capturedFile.type,
        });

        setAnalysisResult({
          emptySpaces: Array.isArray(analyzeData.emptySpaces) ? analyzeData.emptySpaces.length : (analyzeData.emptySpaces || 0),
          analysisConfidence: analyzeData.analysisConfidence || 100,
          currentInventory: analyzeData.currentInventory || [],
          shelfSpaceId: analyzeData.id,
        });
        
        // Step 2: Match Campaign
        try {
          // Extract actual location from shopkeeper's store address
          const shopkeeperLocation = shopkeeper?.store_address 
            ? extractCityFromAddress(shopkeeper.store_address)
            : 'Unknown';

          console.log('[Camera] 📍 Extracted location:', shopkeeperLocation);
          console.log('[Camera] 🏪 Store address:', shopkeeper?.store_address);

          const response = await apiClient.post<{ data?: any; status?: number }>('/api/campaigns/match', {
            shopkeeperId: shopkeeper.id,
            shelfSpaceId: analyzeData.id,
            location: shopkeeperLocation,
            emptySpaces: Array.isArray(analyzeData.emptySpaces) && analyzeData.emptySpaces.length > 0 ? analyzeData.emptySpaces : [{ id: 'space-1', shelf_level: 1 }], 
          });

          console.log('[Camera] 📦 Full response:', response);
          console.log('[Camera] 📦 Response data:', response.data);
          console.log('[Camera] 📦 Response status:', response.status);
          
          // Handle different response structures
          const matchData = response.data || response;
          
          if (!matchData || typeof matchData !== 'object') {
            console.error('[Camera] ❌ Invalid match data:', matchData);
            setAnalysisResult(prev => prev ? {
              ...prev,
              message: 'Failed to match campaigns. Please try again.'
            } : null);
            setState('done');
            return;
          }

          console.log('[Camera] ✅ Match data:', matchData);

          if (matchData.matched && matchData.campaign) {
            console.log('[Camera] 🎉 Campaign matched!', matchData.campaign);
            setMatchedCampaign({
              id: matchData.campaign.id,
              brandName: matchData.campaign.brandName || matchData.campaign.brand_name,
              productName: matchData.campaign.productName || matchData.campaign.product_name,
              earnings: matchData.campaign.earnings || matchData.earnings,
              taskId: matchData.taskId,
            });
            setState('offer');
          } else {
            console.log('[Camera] ℹ️ No campaign matched:', matchData.message);
            setAnalysisResult(prev => prev ? {
              ...prev,
              message: matchData.message || 'No campaigns matched your current shelf availability.'
            } : null);
            setState('done');
          }
        } catch (matchError) {
          console.error('Campaign match error:', matchError);
          setState('done');
        }
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
    setState('ready');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark text-text-main dark:text-gray-100 font-sans antialiased">
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
      <div className="relative flex-1 flex flex-col bg-surface-light dark:bg-surface-dark -mt-6 rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-20 px-6 pt-6 overflow-y-auto">
        <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6 shrink-0"></div>
        
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

          {/* OFFER STATE */}
          {state === 'offer' && matchedCampaign && (
            <div className="flex-1 flex flex-col items-center pt-4 animate-fadeInUp">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner bg-primary/10 text-primary`}>
                🎯
              </div>
              <h2 className="text-[#1a1c1e] text-2xl font-black mb-2 text-center">
                Match Found: {matchedCampaign.brandName}
              </h2>
              <p className="text-slate-600 text-[17px] mb-8 font-medium text-center px-4 leading-snug">
                Earn <span className="text-[#11d452] font-black">₹{matchedCampaign.earnings}</span> by placing {matchedCampaign.productName} here.
              </p>

              <div className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl mb-6 shadow-sm">
                <h3 className="font-bold text-slate-800 text-[15px] text-center">Do you currently have this item in stock?</h3>
              </div>

              <div className="mt-auto w-full flex flex-col gap-3 pb-4">
                <button 
                  onClick={() => router.push('/tasks')}
                  className="w-full flex items-center justify-center gap-3 bg-[#11d452] py-4 rounded-xl text-white shadow-[0_8px_20px_rgba(17,212,82,0.3)] active:scale-95 transition-all text-lg font-bold"
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                  YES, Accept Task
                </button>
                <button 
                  onClick={() => setState('done')}
                  className="w-full flex items-center justify-center gap-3 bg-slate-100 py-4 rounded-xl text-slate-600 active:bg-slate-200 transition-all text-[15px] font-bold"
                >
                  <X className="w-5 h-5 stroke-[3]" />
                  NO, Out of Stock
                </button>
              </div>
            </div>
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
                      <span className="text-4xl font-extrabold text-[#8c25f4]">{analysisResult.analysisConfidence}%</span>
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
