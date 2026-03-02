'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const phoneNumber = `+91${phoneDigits}`;
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (name.trim().length === 0) {
      setError('Name is required.');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    if (phoneDigits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      await signUp(phoneNumber, password, name, email);
      // Redirect to verification page
      router.push(`/verify?phone=${encodeURIComponent(phoneNumber)}`);
    } catch (err: unknown) {
      console.error('Sign up error:', err);
      if (err instanceof Error) {
        if (err.message.includes('UsernameExistsException')) {
          setError('An account with this phone number already exists.');
        } else {
          setError(err.message || 'Failed to create account.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container gradient-mesh flex flex-col items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-sm">
        
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="w-16 h-16 mx-auto bg-white/60 rounded-2xl flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-sm mt-1 text-slate-500 font-medium">
            Join Shelf-Bidder today
          </p>
        </div>

        <div className="glass-card p-6 animate-fadeInUp animate-fadeInUp-delay-1 w-full">
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Kumar"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors placeholder:text-slate-400"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@example.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors placeholder:text-slate-400"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-4 py-3 border border-r-0 border-slate-200 bg-slate-100 rounded-l-xl text-sm font-bold text-slate-600">+91</span>
                <input
                  type="tel"
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors placeholder:text-slate-400"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors placeholder:text-slate-400"
                disabled={isLoading}
              />
              <p className="text-[10px] mt-1 text-slate-500 font-medium">Minimum 8 characters</p>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3 mt-4 text-black font-bold shadow-lg shadow-brand-green/30"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-slate-800/30 border-t-slate-800 rounded-full"></span>
                  Creating Account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs font-medium text-slate-500">
              Already have an account?{' '}
              <Link href="/signin" className="font-bold text-[var(--primary-dark)] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
