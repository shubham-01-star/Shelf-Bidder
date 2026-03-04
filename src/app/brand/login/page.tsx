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
 <div className="flex h-screen w-full font-sans overflow-hidden bg-background-light ">
 {/* Left Column (Brand Showcase) */}
 <div className="hidden lg:flex flex-col justify-center items-center w-1/2 p-12 bg-gradient-to-br from-primary to-background-dark text-white relative overflow-hidden">
 {/* Decorative Element */}
 <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
 <div className="z-10 text-center max-w-xl flex flex-col items-center">
 <div className="mb-10 text-white flex items-center gap-3">
 <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-sm">
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

 {/* Right Column (Auth Form) */}
 <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8 lg:p-24 bg-white dark:bg-slate-900 overflow-y-auto">
 <div className="w-full max-w-md">
 {/* Mobile Header */}
 <div className="flex lg:hidden items-center gap-3 mb-12">
 <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
 <span className="material-symbols-outlined text-xl">storefront</span>
 </div>
 <span className="text-text-main text-2xl font-bold tracking-tight">Shelf-Bidder</span>
 </div>

 <div className="mb-10 text-left">
 <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
 {showVerification ? 'Check your Email' : isSignup ? 'Create Account' : 'Welcome Back'}
 </h2>
 <p className="text-slate-500 dark:text-slate-400 text-base">
 {showVerification 
 ? `We sent a 6-digit verification code to ${email}.` 
 : isSignup 
 ? 'Set up your brand profile to start bidding.' 
 : 'Access your brand dashboard and manage bids'}
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
 <label className="text-text-sub text-sm font-medium">Verification Code (6-Digits)</label>
 <input
 type="text"
 value={otpCode}
 onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
 placeholder="------"
 className="w-full px-5 py-4 bg-surface-light text-center tracking-[1em] font-bold text-2xl border border-gray-200 rounded-[8px] focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-text-main placeholder:text-gray-400 outline-none"
 required
 />
 </div>
 ) : isSignup ? (
 <>
 <div>
 <label className="sr-only">Brand Name</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
 <span className="material-symbols-outlined text-slate-400">business</span>
 </div>
 <input
 type="text"
 value={brandName}
 onChange={(e) => setBrandName(e.target.value)}
 placeholder="Brand Name"
 required
 className="block w-full pl-12 pr-4 py-4 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
 />
 </div>
 </div>
 <div>
 <label className="sr-only">Contact Person</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
 <span className="material-symbols-outlined text-slate-400">person</span>
 </div>
 <input
 type="text"
 value={contactPerson}
 onChange={(e) => setContactPerson(e.target.value)}
 placeholder="Contact Person"
 required
 className="block w-full pl-12 pr-4 py-4 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
 />
 </div>
 </div>
 </>
 ) : null}

 <div>
 <label className="sr-only">Corporate Email</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
 <span className="material-symbols-outlined text-slate-400">mail</span>
 </div>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="Corporate Email"
 required
 className="block w-full pl-12 pr-4 py-4 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
 />
 </div>
 </div>

 <div>
 <label className="sr-only">Password</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
 <span className="material-symbols-outlined text-slate-400">lock</span>
 </div>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Password"
 required
 className="block w-full pl-12 pr-4 py-4 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
 />
 </div>
 {!isSignup && (
 <div className="flex items-center justify-between mt-4">
 <div className="flex items-center px-2">
 <input className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" id="remember-me" name="remember-me" type="checkbox"/>
 <label className="ml-2 block text-sm text-slate-600 dark:text-slate-400" htmlFor="remember-me">Remember me</label>
 </div>
 <div className="text-sm">
 <button type="button" className="font-medium text-primary hover:text-primary/80 transition-colors" onClick={() => alert('Password reset link will be sent to your registered email. Contact support@shelfbidder.com for assistance.')}>
 Forgot password?
 </button>
 </div>
 </div>
 )}
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-full shadow-sm text-base font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors group mt-6 disabled:opacity-50"
 >
 {loading 
 ? 'Please wait...' 
 : showVerification 
 ? 'Verify Code'
 : isSignup 
 ? 'Create Account' 
 : 'Login to Dashboard'}
 {!loading && <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>}
 </button>
 
 {!isSignup && !showVerification && (
 <>
 <div className="mt-8">
 <div className="relative">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
 </div>
 <div className="relative flex justify-center text-sm">
 <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 font-medium tracking-wide">OR CONTINUE WITH</span>
 </div>
 </div>
 <div className="mt-8">
 <button
 type="button"
 className="w-full flex items-center justify-center py-4 px-4 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
 onClick={() => alert('Google Sign-In is coming soon! Please use email & password login for now.')}
 >
 <svg aria-hidden="true" className="h-5 w-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
 </svg>
 Sign in with Google
 </button>
 </div>
 </div>
 </>
 )}
 </form>

 {showVerification ? (
 <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
 Didn&apos;t receive the email?{' '}
 <button
 type="button"
 className="font-semibold text-primary hover:text-primary/80 transition-colors"
 onClick={() => { setShowVerification(false); setError(''); setSuccessMessage(''); }}
 >
 Go back and edit email
 </button>
 </p>
 ) : (
 <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
 {isSignup ? 'Already have an account? ' : "Don't have an account? "}
 <button
 type="button"
 onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMessage(''); }}
 className="font-semibold text-primary hover:text-primary/80 transition-colors"
 >
 {isSignup ? 'Sign In' : 'Request Access'}
 </button>
 </p>
 )}
 </div>
 </div>
 </div>
 );
}
