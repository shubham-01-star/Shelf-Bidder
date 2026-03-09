'use client';

/**
 * Brand Login Page - Light Warm Theme
 * Redesigned for brand dashboard with #f8f5f5 background and #ff5c61 accents
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function BrandLoginPage() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode');
  const [isSignup, setIsSignup] = useState(initialMode === 'signup');
  const [brandName, setBrandName] = useState('');
  const [email, setEmail] = useState('shubhmkumar@gmail.com');
  const [contactPerson, setContactPerson] = useState('');
  const [password, setPassword] = useState('Test@1234');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const endpoint = isSignup ? '/api/brand/auth/signup' : '/api/brand/auth/signin';
    const payload = isSignup 
      ? { brandName, email, password, contactPerson }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || 'Something went wrong');
        return;
      }

      if (isSignup) {
        setSuccessMessage('Account created! Please sign in with your credentials.');
        setTimeout(() => {
          setIsSignup(false);
          setSuccessMessage('');
          setPassword('');
        }, 2500);
        return;
      }

      // Store brand info from Signin response
      localStorage.setItem('brandToken', data.accessToken);
      localStorage.setItem('brandRefreshToken', data.refreshToken);
      localStorage.setItem(
        'brandTokenExpiresAt',
        String(Date.now() + (data.expiresIn || 0) * 1000)
      );
      if (data.brand) {
        localStorage.setItem('brandId', data.brand.id);
        localStorage.setItem('brandName', data.brand.name);
      }

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      window.location.href = '/brand';
    } catch (err) {
      console.error('Auth error:', err);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full font-sans overflow-hidden bg-brand-bg">
      {/* Left Column (Brand Showcase) - Light Warm Theme */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 p-12 bg-gradient-to-br from-brand-accent to-primary-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 mix-blend-overlay"></div>
        <div className="z-10 text-center max-w-xl flex flex-col items-center">
          <div className="mb-10 text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-soft">
              <span className="material-symbols-outlined text-2xl">storefront</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Shelf-Bidder</span>
          </div>
          <h1 className="text-white text-5xl xl:text-6xl font-bold leading-tight tracking-tight mb-8">
            Empowering Brands to Win Retail Real Estate
          </h1>
          <p className="text-lg lg:text-xl font-normal opacity-90 leading-relaxed">
            Optimize your presence in Kirana stores with the world&apos;s first digital shelf-bidding engine.
          </p>
        </div>
        <div className="absolute bottom-12 text-white/50 text-sm">
          © {new Date().getFullYear()} Shelf-Bidder. All rights reserved.
        </div>
      </div>

      {/* Right Column (Auth Form) - Light Warm Theme */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8 lg:p-24 bg-surface-light overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="flex lg:hidden items-center gap-3 mb-12">
            <div className="w-8 h-8 bg-brand-accent rounded-2xl flex items-center justify-center text-white shadow-soft">
              <span className="material-symbols-outlined text-xl">storefront</span>
            </div>
            <span className="text-text-main text-2xl font-bold tracking-tight">Shelf-Bidder</span>
          </div>

          <div className="mb-10 text-left">
            <h2 className="text-3xl font-bold text-text-main mb-2">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-text-sub text-base">
              {isSignup 
                ? 'Set up your brand profile to start bidding.' 
                : 'Access your brand dashboard and manage bids'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl text-sm font-medium bg-red-50 text-red-600 border border-red-100 shadow-soft">
                {error}
              </div>
            )}
            {successMessage && !error && (
              <div className="p-4 rounded-2xl text-sm font-medium bg-green-50 text-green-600 border border-green-100 shadow-soft">
                {successMessage}
              </div>
            )}

            {isSignup && (
              <>
                <div>
                  <label className="sr-only">Brand Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-text-sub">business</span>
                    </div>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Brand Name"
                      required
                      className="block w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white text-text-main focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all text-base shadow-soft"
                    />
                  </div>
                </div>
                <div>
                  <label className="sr-only">Contact Person</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-text-sub">person</span>
                    </div>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Contact Person"
                      required
                      className="block w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white text-text-main focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all text-base shadow-soft"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="sr-only">Corporate Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-text-sub">mail</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Corporate Email"
                  required
                  className="block w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white text-text-main focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all text-base shadow-soft"
                />
              </div>
            </div>

            <div>
              <label className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-text-sub">lock</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="block w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white text-text-main focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all text-base shadow-soft"
                />
              </div>
              {!isSignup && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center px-2">
                    <input 
                      className="h-4 w-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent cursor-pointer" 
                      id="remember-me" 
                      name="remember-me" 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label className="ml-2 block text-sm text-text-sub cursor-pointer" htmlFor="remember-me">
                      Remember me
                    </label>
                  </div>
                  <div className="text-sm">
                    <button 
                      type="button" 
                      className="font-medium text-brand-accent hover:text-primary-dark transition-colors" 
                      onClick={() => alert('Password reset link will be sent to your registered email. Contact support@shelfbidder.com for assistance.')}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-soft text-base font-bold text-white bg-brand-accent hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-all group mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? 'Please wait...' 
                : isSignup 
                  ? 'Create Account' 
                  : 'Login to Dashboard'}
              {!loading && <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
            
            {!isSignup && (
              <>
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-surface-light text-text-sub font-medium tracking-wide">OR CONTINUE WITH</span>
                    </div>
                  </div>
                  <div className="mt-8">
                    <button
                      type="button"
                      className="w-full flex items-center justify-center py-4 px-4 border border-gray-200 rounded-2xl shadow-soft bg-white text-base font-medium text-text-main hover:bg-gray-50 transition-all"
                      onClick={() => alert('Google Sign-In is coming soon! Please use email & password login for now.')}
                    >
                      <svg aria-hidden="true" className="h-5 w-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                      </svg>
                      Sign in with Google
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-text-sub">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMessage(''); }}
              className="font-semibold text-brand-accent hover:text-primary-dark transition-colors"
            >
              {isSignup ? 'Sign In' : 'Request Access'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
