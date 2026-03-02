'use client';

/**
 * Brand Login / Signup Page
 * Simple prototype auth for brand owners
 */

import { useState } from 'react';

export default function BrandLoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [email, setEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP Verification state
  const [showVerification, setShowVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/brand/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isSignup ? 'signup' : 'login',
          brandName,
          email,
          contactPerson,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || 'Something went wrong');
        return;
      }

      if (isSignup && data.requiresVerification) {
        setSuccessMessage(data.message);
        setShowVerification(true);
        return;
      }

      // Store brand info
      localStorage.setItem('brandToken', data.token);
      localStorage.setItem('brandId', data.brand.id);
      localStorage.setItem('brandName', data.brand.brandName);

      window.location.href = '/brand';
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/brand/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || 'Verification failed');
        return;
      }

      // Verification success, now let's login
      setSuccessMessage('Verified successfully! Logging you in...');
      setTimeout(() => {
        setIsSignup(false);
        setShowVerification(false);
        handleSubmit(new Event('submit') as unknown as React.FormEvent);
      }, 1500);
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full font-sans overflow-hidden bg-[#0a0510]">
      {/* Left Column (Brand Showcase) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center px-16 xl:px-24 bg-[#8c25f4] overflow-hidden">
        <div className="absolute inset-0 opacity-50 mix-blend-overlay">
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD_w_AmdA66fxaMJKQNfVdVtcyY3ZjycHxfGv-s09DQTsOgBFybqLM1EyVmTndoHnbnDTKWduAuKUnGiGEACfv4AojwDrKIPHu-feVODJ2jiK_2makkm9weySMTZ1XYiDfDlHbC820SAPRG1QHgXw1A9kWeohDe7aZ29n2tSsAkGRRNnLWer6bjTo1AJ84YtLCt3wMhmkgdDNugu5ArMYr3yrQEGqeP0R3U9ubMgrcXk-GwV0HA4V32KMXRFMPayQMdNReVPe1mZvM')" }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#8c25f4]/90 via-[#8c25f4]/70 to-[#0a0510]" />
        
        <div className="relative z-10 max-w-xl">
          <div className="mb-10 text-white flex items-center gap-3">
             <div className="text-4xl filter drop-shadow-md">🏢</div>
             <span className="text-2xl font-bold tracking-tight">Shelf-Bidder</span>
          </div>
          <h1 className="text-white text-5xl xl:text-6xl font-bold leading-tight tracking-tight mb-8">
            Empowering Brands to Win Retail Real Estate
          </h1>
          <p className="text-white/80 text-lg xl:text-xl font-light leading-relaxed">
            Optimize your presence in Kirana stores with the world's first digital shelf-bidding engine.
          </p>
        </div>
        <div className="absolute bottom-12 left-16 xl:left-24 text-white/50 text-sm">
          © {new Date().getFullYear()} Shelf-Bidder. All rights reserved.
        </div>
      </div>

      {/* Right Column (Auth Form) */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 md:p-16 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="flex lg:hidden items-center gap-3 mb-12">
            <div className="text-4xl text-[#8c25f4]">🏢</div>
            <span className="text-white text-2xl font-bold tracking-tight">Shelf-Bidder</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              {showVerification ? 'Check your Email' : isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              {showVerification 
                ? `We sent a 6-digit verification code to ${email}.` 
                : isSignup 
                  ? 'Set up your brand profile to start bidding.' 
                  : 'Access your brand dashboard and manage bids.'}
            </p>
          </div>

          <form onSubmit={showVerification ? handleVerify : handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </div>
            )}
            {successMessage && !error && (
              <div className="p-4 rounded-xl text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                {successMessage}
              </div>
            )}

            {showVerification ? (
              <div className="flex flex-col gap-2">
                <label className="text-slate-300 text-sm font-medium">Verification Code (6-Digits)</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  className="w-full px-5 py-4 bg-[#120a1d] text-center tracking-[1em] font-bold text-2xl border border-slate-800 rounded-[8px] focus:ring-2 focus:ring-[#8c25f4]/40 focus:border-[#8c25f4] transition-all text-white placeholder:text-slate-600 outline-none"
                  required
                />
              </div>
            ) : isSignup ? (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-300 text-sm font-medium">Brand Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. PepsiCo, Coca-Cola"
                    required
                    className="w-full px-5 py-4 bg-[#120a1d] border border-slate-800 rounded-[8px] focus:ring-2 focus:ring-[#8c25f4]/40 focus:border-[#8c25f4] transition-all text-white placeholder:text-slate-600 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-300 text-sm font-medium">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full px-5 py-4 bg-[#120a1d] border border-slate-800 rounded-[8px] focus:ring-2 focus:ring-[#8c25f4]/40 focus:border-[#8c25f4] transition-all text-white placeholder:text-slate-600 outline-none"
                  />
                </div>
              </>
            ) : null}

            <div className="flex flex-col gap-2">
              <label className="text-slate-300 text-sm font-medium">Corporate Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@brand.com"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-[#120a1d] border border-slate-800 rounded-[8px] focus:ring-2 focus:ring-[#8c25f4]/40 focus:border-[#8c25f4] transition-all text-white placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 text-sm font-medium">Password</label>
                {!isSignup && (
                  <button type="button" className="text-[#8c25f4] hover:text-[#8c25f4]/80 text-sm font-semibold transition-colors" onClick={() => alert('Password reset link will be sent to your registered email. Contact support@shelfbidder.com for assistance.')}>
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-4 bg-[#120a1d] border border-slate-800 rounded-[8px] focus:ring-2 focus:ring-[#8c25f4]/40 focus:border-[#8c25f4] transition-all text-white placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8c25f4] hover:bg-[#8c25f4]/90 text-white font-bold py-4 rounded-[8px] shadow-xl shadow-[#8c25f4]/20 transform active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              <span>
                {loading 
                  ? 'Please wait...' 
                  : showVerification 
                    ? 'Verify Code'
                    : isSignup 
                      ? 'Create Account' 
                      : 'Login to Dashboard'}
              </span>
              {!loading && <span className="text-xl leading-none">→</span>}
            </button>
            
            {!isSignup && !showVerification && (
              <>
                <div className="relative flex items-center py-6">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold uppercase tracking-widest">Or continue with</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>
                <button
                  type="button"
                  className="w-full bg-[#120a1d] border border-slate-800 text-slate-200 font-semibold py-4 rounded-[8px] hover:bg-slate-800/50 transition-all flex items-center justify-center gap-3"
                  onClick={() => alert('Google Sign-In is coming soon! Please use email & password login for now.')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </>
            )}
          </form>

          {showVerification ? (
            <p className="mt-12 text-center text-slate-500 text-sm">
              Didn't receive the email?{' '}
              <button
                type="button"
                className="text-[#8c25f4] font-bold hover:underline"
                onClick={() => { setShowVerification(false); setError(''); setSuccessMessage(''); }}
              >
                Go back and edit email
              </button>
            </p>
          ) : (
            <p className="mt-12 text-center text-slate-500 text-sm flex items-center justify-center gap-1">
              {isSignup ? 'Already have an account?' : 'New to the portal?'}
              <button
                type="button"
                onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMessage(''); }}
                className="text-[#8c25f4] font-bold hover:underline"
              >
                {isSignup ? 'Sign In' : 'Contact Account Manager'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
