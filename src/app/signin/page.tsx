'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Store } from 'lucide-react';

export default function SignInPage() {
  const [phoneWithoutCode, setPhoneWithoutCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (phoneWithoutCode.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    try {
      setIsLoading(true);
      const fullPhoneNumber = `+91${phoneWithoutCode}`;
      await signIn(fullPhoneNumber, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      if (err instanceof Error) {
        if (err.message.includes('UserNotConfirmedException')) {
          router.push(`/verify?phone=${encodeURIComponent(`+91${phoneWithoutCode}`)}`);
          return;
        }
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start overflow-x-hidden bg-background-light dark:bg-background-dark font-sans text-text-main dark:text-gray-100 antialiased">
      <div className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-background-light dark:bg-background-dark overflow-hidden mx-auto shadow-sm">
        <div className="h-11 w-full"></div> {/* iOS status bar spacer */}
        
        <div className="flex flex-col items-center pt-12 pb-10">
          <div className="bg-[#11d452]/10 p-5 rounded-2xl mb-5 border border-[#11d452]/20">
            <Store className="text-[#11d452] w-12 h-12" strokeWidth={2} />
          </div>
          <h2 className="text-[#11d452] text-2xl font-bold tracking-tight">Shelf-Bidder</h2>
        </div>
        
        <div className="flex-1 px-8">
          <div className="mb-12">
            <h1 className="text-text-main dark:text-white text-3xl font-bold leading-tight mb-3">Welcome!</h1>
            <p className="text-text-sub dark:text-gray-400 text-lg font-light leading-snug">Enter your credentials to get started</p>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="space-y-6">
              {/* Phone Input */}
              <div className="group relative flex items-center bg-surface-light dark:bg-surface-dark border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-1.5 focus-within:border-primary focus-within:bg-surface-light dark:focus-within:bg-surface-dark transition-all duration-200">
                <div className="flex items-center justify-center px-4 border-r-2 border-gray-200 dark:border-gray-800 py-4">
                  <span className="text-xl font-bold text-text-main dark:text-white">+91</span>
                </div>
                <div className="flex-1">
                  <input 
                    className="w-full bg-transparent border-none focus:ring-0 text-xl font-semibold tracking-widest p-4 text-text-main dark:text-white placeholder:text-gray-400 focus:outline-none" 
                    maxLength={10} 
                    placeholder="98765 43210" 
                    type="tel"
                    value={phoneWithoutCode}
                    onChange={(e) => setPhoneWithoutCode(e.target.value.replace(/\D/g, ''))}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="group relative flex items-center bg-surface-light dark:bg-surface-dark border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-1.5 focus-within:border-primary focus-within:bg-surface-light dark:focus-within:bg-surface-dark transition-all duration-200">
                <div className="flex-1">
                  <input 
                    className="w-full bg-transparent border-none focus:ring-0 text-xl font-semibold p-4 text-text-main dark:text-white placeholder:text-gray-400 focus:outline-none" 
                    placeholder="Password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <p className="mt-6 text-center text-xs text-text-sub dark:text-gray-400 px-6 leading-relaxed">
              Don&apos;t have an account? <Link href="/signup" className="text-text-main dark:text-white font-bold underline">Register here</Link>
            </p>

            <div className="mt-auto pt-12 pb-12 w-full">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white text-xl font-bold py-5 rounded-2xl transition-all active:scale-[0.97] shadow-lg shadow-primary/30 flex items-center justify-center gap-3 disabled:opacity-70 disabled:active:scale-100"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
                {!isLoading && <ArrowRight className="w-6 h-6" strokeWidth={3} />}
              </button>
              
              <div className="mt-10 flex justify-center items-center gap-2 text-slate-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Secure Kirana Network</span>
              </div>
            </div>
          </form>
        </div>
        
        <div className="absolute top-0 left-0 w-full h-80 -z-10 bg-gradient-to-b from-[#11d452]/5 to-transparent"></div>
      </div>
    </div>
  );
}
