'use client';

import { useRouter } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import { useAuth } from '@/lib/auth/AuthContext';
import { ArrowLeft, Store, Pencil, Wallet, Languages, HeadphonesIcon, FileText, LogOut, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { shopkeeper, signOut } = useAuth();
  
  // Use user data if available, otherwise fallback to defaults
  const shopkeeperData = shopkeeper as any;
  const storeName = shopkeeperData?.storeName || 'My Kirana Store';
  const ownerName = shopkeeper?.name || 'Store Owner';
  const upiId = shopkeeperData?.paymentDetails?.upiId || 'Not configured';

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-[#f6f8f6] text-[#1a1c1e] shadow-2xl overflow-x-hidden font-sans antialiased">
      {/* Header */}
      <div className="flex items-center p-6 pb-4 justify-between bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100">
        <button 
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full bg-[#11d452]/10 text-[#1a1c1e] hover:bg-[#11d452]/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-extrabold flex-1 text-center pr-10 tracking-tight">Store Profile</h2>
      </div>

      <div className="flex flex-col gap-6 p-4 pb-32 overflow-y-auto">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 animate-fadeInUp">
          <div className="relative">
            <div className="bg-[#11d452]/10 aspect-square rounded-full flex items-center justify-center size-28 border border-[#11d452]/20 overflow-hidden shadow-inner">
              <Store className="w-12 h-12 text-[#11d452] opacity-80" />
            </div>
            <button className="absolute bottom-0 right-0 bg-[#11d452] text-[#1a1c1e] p-2 rounded-full border-2 border-white shadow-md active:scale-95 transition-transform">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-[#1a1c1e]">{storeName}</h1>
            <p className="text-[#11d452] font-bold mt-1">Owner: {ownerName}</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="flex flex-col gap-3 animate-fadeInUp animate-fadeInUp-delay-1">
          <h3 className="text-[#1a1c1e] text-base font-bold px-1">Payment Details</h3>
          <div className="flex items-center gap-4 bg-white p-4 rounded-[1.25rem] border border-slate-100 shadow-sm justify-between">
            <div className="flex items-center gap-4">
              <div className="text-[#11d452] bg-[#11d452]/10 flex items-center justify-center rounded-xl shrink-0 size-12 shadow-sm border border-[#11d452]/5">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <p className="text-[#1a1c1e] text-sm font-bold">{upiId}</p>
                <p className="text-slate-500 text-xs font-semibold mt-0.5">Primary UPI ID</p>
              </div>
            </div>
            <button className="flex items-center justify-center rounded-lg h-9 px-4 bg-[#11d452] text-[#1a1c1e] text-sm font-black active:scale-95 transition-transform shadow-sm">
              Edit
            </button>
          </div>
        </div>

        {/* Settings List */}
        <div className="flex flex-col gap-3 animate-fadeInUp animate-fadeInUp-delay-2 mt-2">
          <h3 className="text-[#1a1c1e] text-base font-bold px-1 mb-1">Settings</h3>
          
          {/* Language */}
          <button className="flex items-center justify-between p-4 bg-white rounded-[1.25rem] border border-slate-100 active:bg-slate-50 transition-colors shadow-sm w-full">
            <div className="flex items-center gap-4 text-left">
              <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                <Languages className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-[#1a1c1e] text-[15px] font-bold">Language</p>
                <p className="text-slate-500 text-xs font-semibold mt-0.5">English / Hindi</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
          
          {/* Help & Support */}
          <button className="flex items-center justify-between p-4 bg-white rounded-[1.25rem] border border-slate-100 active:bg-slate-50 transition-colors shadow-sm w-full">
            <div className="flex items-center gap-4 text-left">
              <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                 <HeadphonesIcon className="w-5 h-5 text-slate-700" />
              </div>
              <p className="text-[#1a1c1e] text-[15px] font-bold">Help & Support</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
          
          {/* Terms & Conditions */}
          <button className="flex items-center justify-between p-4 bg-white rounded-[1.25rem] border border-slate-100 active:bg-slate-50 transition-colors shadow-sm w-full">
            <div className="flex items-center gap-4 text-left">
              <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                 <FileText className="w-5 h-5 text-slate-700" />
              </div>
              <p className="text-[#1a1c1e] text-[15px] font-bold">Terms & Conditions</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
          
          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="flex items-center justify-between p-4 bg-white rounded-[1.25rem] border border-red-100 active:bg-red-50 transition-colors shadow-sm w-full mt-4"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="size-10 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-red-500 text-[15px] font-bold">Logout</p>
            </div>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
