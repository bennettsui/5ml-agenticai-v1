'use client';

import React, { ReactNode } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error details for debugging
    console.error('❌ Error Boundary Caught:', error, errorInfo);

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="max-w-md w-full mx-4">
              {/* Card Container */}
              <div className="rounded-xl border border-red-500/30 bg-slate-800/60 backdrop-blur-xl p-8 shadow-2xl">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                </div>

                {/* Error Message */}
                <h1 className="text-2xl font-bold text-white text-center mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-slate-400 text-center mb-6">
                  We encountered an unexpected error. Please try again or return home.
                </p>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 rounded-lg bg-slate-900/50 border border-red-500/20">
                    <p className="text-xs font-mono text-red-300 mb-2">Error Details:</p>
                    <p className="text-xs font-mono text-slate-300 break-all">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <details className="mt-4 cursor-pointer">
                        <summary className="text-xs text-slate-400 hover:text-slate-300">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs text-slate-400 overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={this.reset}
                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    Try Again
                  </button>
                  <a
                    href="/"
                    className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </a>
                </div>

                {/* Support Info */}
                <p className="mt-6 text-xs text-slate-500 text-center">
                  If this problem persists, please contact support
                </p>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
