'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';

export default function SignInPage() {
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (phoneNumber.length < 13) { // +91 + 10 digits
      setError('Please enter a valid 10-digit mobile number with country code.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(phoneNumber, password);
      // AuthContext will automatically redirect or handle tokens,
      // but we explicitly push them to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      // Cognito throws specific errors, we try to parse them
      if (err instanceof Error) {
        if (err.message.includes('UserNotConfirmedException')) {
          router.push(`/verify?phone=${encodeURIComponent(phoneNumber)}`);
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
    <div className="page-container gradient-mesh flex flex-col items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-sm">
        
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
            <span className="text-3xl">🏪</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Sign in to manage your shelf and earnings
          </p>
        </div>

        <div className="glass-card p-6 animate-fadeInUp animate-fadeInUp-delay-1 w-full">
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            
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
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-bold text-white hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
