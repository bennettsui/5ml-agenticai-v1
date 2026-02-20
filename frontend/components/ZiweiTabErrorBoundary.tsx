'use client';

import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  tabName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ZiweiTabErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error) {
    console.error(`❌ Error in ${this.props.tabName} tab:`, error);
    this.setState({ error });
  }

  private reset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-500/30 bg-slate-800/40 p-8 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {this.props.tabName} Tab Error
          </h3>
          <p className="text-slate-400 mb-4 text-sm">
            An error occurred while loading this tab.
            {process.env.NODE_ENV === 'development' && (
              <>
                <br />
                <code className="text-xs text-red-300 mt-2 block break-all">
                  {this.state.error?.message}
                </code>
              </>
            )}
          </p>
          <button
            onClick={this.reset}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
