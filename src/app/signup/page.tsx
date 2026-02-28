'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91');
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
    if (phoneNumber.length < 13) {
      setError('Please enter a valid 10-digit mobile number with +91 code.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      await signUp(phoneNumber, password, name);
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
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Join Shelf-Bidder today
          </p>
        </div>

        <div className="glass-card p-6 animate-fadeInUp animate-fadeInUp-delay-1 w-full">
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                FULL NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Kumar"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                MOBILE NUMBER
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+919876543210"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                disabled={isLoading}
              />
              <p className="text-[10px] mt-1 opacity-60">Minimum 8 characters</p>
            </div>

            {error && (
              <p className="text-xs text-red-400 font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                  Creating Account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link href="/signin" className="font-bold text-white hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
