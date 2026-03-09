'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';

function VerifyOTPForm() {
  const [otp, setOtp] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { verifyPhoneNumber } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Pre-fill phone number if passed from signup
    const phone = searchParams.get('phone');
    if (phone) {
      setPhoneNumber(decodeURIComponent(phone));
    }
  }, [searchParams]);

  const handleResendCode = async () => {
    if (!phoneNumber) {
      setError('Phone number is missing.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');

      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }

      setSuccessMessage(data.message || 'Verification code resent successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: unknown) {
      console.error('Resend error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to resend code. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!phoneNumber) {
      setError('Phone number is missing.');
      return;
    }

    try {
      setIsLoading(true);
      await verifyPhoneNumber(phoneNumber, otp);
      alert('Verification successful! You can now sign in.');
      router.push('/signin');
    } catch (err: unknown) {
      console.error('Verification error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Verification failed. Please check the code and try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      
      <div className="text-center mb-8 animate-fadeInUp">
        <div className="w-16 h-16 mx-auto bg-white/60 rounded-2xl flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
          <span className="text-3xl">🛡️</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Verify Account</h1>
        <p className="text-sm mt-1 text-slate-500 font-medium">
          Enter the 6-digit code sent to<br/> {phoneNumber || 'your phone'}
        </p>
      </div>

      <div className="glass-card p-6 animate-fadeInUp animate-fadeInUp-delay-1 w-full">
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          
          {/* Hidden Phone Field for context mapping if they landed here manually */}
          {!searchParams.get('phone') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+919876543210"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors placeholder:text-slate-400"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              6-Digit Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-center text-2xl tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors placeholder:text-slate-300"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100 text-center">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="text-xs text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-100 text-center">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="btn btn-primary w-full py-3 mt-4 disabled:opacity-50 text-black font-bold shadow-lg shadow-brand-green/30"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-slate-800/30 border-t-slate-800 rounded-full"></span>
                Verifying...
              </span>
            ) : (
              'Verify & Continue'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs font-medium text-slate-500">
            Didn&apos;t receive it?{' '}
            <button 
              className="font-bold text-[var(--primary-dark)] hover:underline disabled:opacity-50"
              onClick={handleResendCode}
              type="button"
              disabled={isLoading}
            >
              Resend Code
            </button>
          </p>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Link href="/signin" className="text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors">
              &larr; Back to Sign In
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="page-container gradient-mesh flex flex-col items-center justify-center p-4 min-h-screen">
      <Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>}>
        <VerifyOTPForm />
      </Suspense>
    </div>
  );
}
