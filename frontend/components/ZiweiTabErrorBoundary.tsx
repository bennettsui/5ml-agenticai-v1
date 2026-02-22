'use client';

import React, { ReactNode } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface Props {
  children: ReactNode;
  tabName: string;
}

interface State {
  hasError:    boolean;
  error:       Error | null;
  errorInfo:   React.ErrorInfo | null;
  showStack:   boolean;
}

export default class ZiweiTabErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showStack: false };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`❌ Error in ${this.props.tabName} tab:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showStack: false });
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, showStack } = this.state;
      return (
        <div className="rounded-xl border border-red-500/30 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <h3 className="text-base font-bold text-white">
              {this.props.tabName} Tab Error
            </h3>
          </div>

          {/* Error message — always visible */}
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
            <p className="text-xs font-semibold text-red-300 mb-1">Error</p>
            <p className="text-sm text-red-200 font-mono break-all">
              {error?.message ?? 'Unknown error'}
            </p>
          </div>

          {/* Component stack — collapsible */}
          {errorInfo?.componentStack && (
            <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 overflow-hidden">
              <button
                onClick={() => this.setState(s => ({ showStack: !s.showStack }))}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 transition-colors"
              >
                <span className="font-medium">Component stack</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStack ? 'rotate-180' : ''}`} />
              </button>
              {showStack && (
                <pre className="px-4 pb-4 text-[10px] text-slate-500 leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={this.reset}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => {
                const text = `Error: ${error?.message}\n\nStack: ${error?.stack}\n\nComponent: ${errorInfo?.componentStack}`;
                navigator.clipboard?.writeText(text);
              }}
              className="px-4 py-2 border border-slate-600 hover:border-slate-400 text-slate-400 hover:text-slate-200 rounded-lg text-sm transition-colors"
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
