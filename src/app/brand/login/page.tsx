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
        setError(data.error || 'Something went wrong');
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

  return (
    <div className="page-container gradient-mesh flex items-center justify-center" style={{ minHeight: '100vh', padding: '24px' }}>
      <div className="w-full" style={{ maxWidth: '400px' }}>
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4"
               style={{ fontSize: '32px' }}>
            🏢
          </div>
          <h1 className="text-2xl font-bold">Shelf-Bidder</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Brand Owner Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4 animate-fadeInUp animate-fadeInUp-delay-1">
          <h2 className="text-lg font-semibold text-center mb-2">
            {isSignup ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div className="p-3 rounded-lg text-sm font-medium"
                 style={{ background: 'rgba(255, 107, 107, 0.15)', color: 'var(--accent)' }}>
              {error}
            </div>
          )}

          {isSignup && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. PepsiCo, Coca-Cola"
                  required
                  className="w-full p-3 rounded-xl text-sm"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Contact Person
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full p-3 rounded-xl text-sm"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="brand@company.com"
              required
              className="w-full p-3 rounded-xl text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full p-3 rounded-xl text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
            style={{ marginTop: '8px' }}
          >
            {loading ? '⏳ Please wait...' : isSignup ? '🚀 Create Account' : '🔐 Sign In'}
          </button>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="font-semibold"
              style={{ color: 'var(--primary-light)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
