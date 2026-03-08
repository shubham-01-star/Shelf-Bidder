'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, Rocket, PlusCircle } from 'lucide-react';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [productName, setProductName] = useState('Coca-Cola 500ml Bottle');
  const [category, setCategory] = useState('Beverages');
  const [budget, setBudget] = useState(5000);
  const [reward, setReward] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const brandId = localStorage.getItem('brandId') || 'brand-demo-001';
      const brandToken = localStorage.getItem('brandToken') || 'demo';

      // Call API to create campaign
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-brand-id': brandId,
          'Authorization': `Bearer ${brandToken}`,
        },
        body: JSON.stringify({
          brandId,
          productName,
          category,
          totalBudget: budget,
          rewardPerPlacement: reward,
          status: 'active'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ Campaign Launched Successfully!\n\nThe system is now ready to detect empty spaces and assign tasks.');
        router.push('/brand/dashboard'); // Redirect to Command Center
      } else {
        alert(`❌ Failed to launch campaign: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Network Error. Campaign could not be launched.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full font-sans bg-background-light dark:bg-background-dark overflow-hidden flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10 w-full">
        <button 
          onClick={() => router.back()} 
          className="mr-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Create Campaign</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Demand Setup</p>
          </div>
        </div>
      </header>

      {/* Form Container */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 w-full flex justify-center">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl p-8 border border-slate-100 dark:border-slate-800 self-start animate-fadeInUp">
          
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-primary" /> Setup New Campaign
            </h2>
            <p className="text-sm text-slate-500 mt-2">Target empty retail shelves with automated bounties.</p>
          </div>

          <form onSubmit={handleLaunch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  Total Budget <span className="text-slate-400">(₹)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full pl-10 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-black text-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  Reward per Placement <span className="text-slate-400">(₹)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">₹</span>
                  <input
                    type="number"
                    value={reward}
                    onChange={(e) => setReward(Number(e.target.value))}
                    className="w-full pl-10 p-4 rounded-xl border border-primary/30 bg-primary/5 text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-black text-lg"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Potential scale: {Math.floor(budget / reward)} stores</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold py-5 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-70 text-lg"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="w-6 h-6" />
                    Launch Campaign
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
