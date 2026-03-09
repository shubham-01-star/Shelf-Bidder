'use client';

/**
 * Error Boundary Component
 *
 * Task 12.1: Comprehensive error handling
 * Catches React rendering errors and displays user-friendly fallback.
 * Requirements: 8.3
 */

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: 'var(--bg-primary, #0F0F1A)', color: 'var(--text-primary, #F0F0F5)' }}
        >
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Something Went Wrong</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary, #9CA3AF)' }}>
              Don&apos;t worry, your data is safe. Try refreshing the page.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="btn btn-outline"
                onClick={() => window.location.href = '/dashboard'}
                id="error-go-home"
              >
                🏠 Go Home
              </button>
              <button
                className="btn btn-primary"
                onClick={this.handleRetry}
                id="error-retry"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
