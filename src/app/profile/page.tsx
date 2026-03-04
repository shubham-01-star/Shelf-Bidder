'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import { useAuth } from '@/lib/auth/AuthContext';
import { ArrowLeft, Store, Pencil, Wallet, Languages, HeadphonesIcon, FileText, LogOut, ChevronRight, X, Save } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { shopkeeper, signOut } = useAuth();
  
  // Use user data if available, otherwise fallback to defaults
  const shopkeeperData = shopkeeper as any;
  const storeName = shopkeeperData?.storeName || 'My Kirana Store';
  const ownerName = shopkeeper?.name || 'Store Owner';
  const upiId = shopkeeperData?.paymentDetails?.upiId || 'Not configured';

  // Edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingUPI, setIsEditingUPI] = useState(false);
  const [editName, setEditName] = useState(ownerName);
  const [editUPI, setEditUPI] = useState(upiId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setSuccessMessage('Profile updated successfully!');
      setIsEditingProfile(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUPI = async () => {
    if (!editUPI.trim()) {
      setError('UPI ID cannot be empty');
      return;
    }

    // Basic UPI validation
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(editUPI)) {
      setError('Please enter a valid UPI ID (e.g., name@upi)');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Note: This would need a separate API endpoint for payment details
      // For now, we'll show a success message
      setSuccessMessage('UPI ID will be updated in the next version!');
      setIsEditingUPI(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Update UPI error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update UPI');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark text-text-main dark:text-gray-100 shadow-2xl overflow-x-hidden font-sans antialiased">
      {/* Header */}
      <div className="flex items-center p-6 pb-4 justify-between bg-surface-light dark:bg-surface-dark sticky top-0 z-10 shadow-sm border-b border-gray-100 dark:border-gray-800">
        <button 
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-text-main dark:text-white hover:bg-primary/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-extrabold flex-1 text-center pr-10 tracking-tight text-text-main dark:text-white">Store Profile</h2>
      </div>

      <div className="flex flex-col gap-6 p-4 pb-32 overflow-y-auto">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-semibold animate-fadeInUp">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-semibold animate-fadeInUp">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center gap-4 animate-fadeInUp">
          <div className="relative">
            <div className="bg-primary/10 aspect-square rounded-full flex items-center justify-center size-28 border border-primary/20 overflow-hidden shadow-inner">
              <Store className="w-12 h-12 text-primary opacity-80" />
            </div>
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full border-2 border-surface-light dark:border-surface-dark shadow-md active:scale-95 transition-transform"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          
          {isEditingProfile ? (
            <div className="w-full space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 text-text-main dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                disabled={isLoading}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setEditName(ownerName);
                    setError('');
                  }}
                  disabled={isLoading}
                  className="bg-gray-100 dark:bg-gray-800 text-text-sub dark:text-gray-400 px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-black text-text-main dark:text-white">{storeName}</h1>
              <p className="text-primary font-bold mt-1">Owner: {ownerName}</p>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="flex flex-col gap-3 animate-fadeInUp animate-fadeInUp-delay-1">
          <h3 className="text-text-main dark:text-white text-base font-bold px-1">Payment Details</h3>
          <div className="flex flex-col gap-3 bg-surface-light dark:bg-surface-dark p-4 rounded-[1.25rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="text-primary bg-primary/10 flex items-center justify-center rounded-xl shrink-0 size-12 shadow-sm border border-primary/5">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <p className="text-text-main dark:text-white text-sm font-bold">{upiId}</p>
                  <p className="text-text-sub dark:text-gray-400 text-xs font-semibold mt-0.5">Primary UPI ID</p>
                </div>
              </div>
              {!isEditingUPI && (
                <button 
                  onClick={() => setIsEditingUPI(true)}
                  className="flex items-center justify-center rounded-lg h-9 px-4 bg-primary text-white text-sm font-black active:scale-95 transition-transform shadow-sm"
                >
                  Edit
                </button>
              )}
            </div>
            
            {isEditingUPI && (
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <input
                  type="text"
                  value={editUPI}
                  onChange={(e) => setEditUPI(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 text-text-main dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  disabled={isLoading}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveUPI}
                    disabled={isLoading}
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingUPI(false);
                      setEditUPI(upiId);
                      setError('');
                    }}
                    disabled={isLoading}
                    className="bg-gray-100 dark:bg-gray-800 text-text-sub dark:text-gray-400 px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings List */}
        <div className="flex flex-col gap-3 animate-fadeInUp animate-fadeInUp-delay-2 mt-2">
          <h3 className="text-text-main dark:text-white text-base font-bold px-1 mb-1">Settings</h3>
          
          {/* Language */}
          <button className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-[1.25rem] border border-gray-100 dark:border-gray-800 active:bg-background-light dark:active:bg-background-dark transition-colors shadow-sm w-full">
            <div className="flex items-center gap-4 text-left">
              <div className="size-10 rounded-lg bg-background-light dark:bg-background-dark flex items-center justify-center border border-gray-100 dark:border-gray-800">
                <Languages className="w-5 h-5 text-text-sub dark:text-gray-400" />
              </div>
              <div>
                <p className="text-text-main dark:text-white text-[15px] font-bold">Language</p>
                <p className="text-text-sub dark:text-gray-400 text-xs font-semibold mt-0.5">English / Hindi</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-sub dark:text-gray-400" />
          </button>
          
          {/* Help & Support */}
          <button className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-[1.25rem] border border-gray-100 dark:border-gray-800 active:bg-background-light dark:active:bg-background-dark transition-colors shadow-sm w-full">
            <div className="flex items-center gap-4 text-left">
              <div className="size-10 rounded-lg bg-background-light dark:bg-background-dark flex items-center justify-center border border-gray-100 dark:border-gray-800">
                 <HeadphonesIcon className="w-5 h-5 text-text-sub dark:text-gray-400" />
              </div>
              <p className="text-text-main dark:text-white text-[15px] font-bold">Help & Support</p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-sub dark:text-gray-400" />
          </button>
          
          {/* Terms & Conditions */}
          <button className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-[1.25rem] border border-gray-100 dark:border-gray-800 active:bg-background-light dark:active:bg-background-dark transition-colors shadow-sm w-full">
            <div className="flex items-center gap-4 text-left">
              <div className="size-10 rounded-lg bg-background-light dark:bg-background-dark flex items-center justify-center border border-gray-100 dark:border-gray-800">
                 <FileText className="w-5 h-5 text-text-sub dark:text-gray-400" />
              </div>
              <p className="text-text-main dark:text-white text-[15px] font-bold">Terms & Conditions</p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-sub dark:text-gray-400" />
          </button>
          
          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-[1.25rem] border border-red-100 dark:border-red-900/50 active:bg-red-50 dark:active:bg-red-900/20 transition-colors shadow-sm w-full mt-4"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="size-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center border border-red-100 dark:border-red-900/50">
                <LogOut className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <p className="text-red-500 dark:text-red-400 text-[15px] font-bold">Logout</p>
            </div>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
