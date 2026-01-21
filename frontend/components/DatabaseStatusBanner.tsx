'use client';

import { AlertTriangle, Database, RefreshCw } from 'lucide-react';

interface DatabaseStatusBannerProps {
  isConnected: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export default function DatabaseStatusBanner({
  isConnected,
  onRetry,
  isRetrying = false
}: DatabaseStatusBannerProps) {
  if (isConnected) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
            Database Unavailable
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
            Unable to connect to the database. Some features are temporarily unavailable:
          </p>
          <ul className="text-sm text-amber-700 dark:text-amber-400 list-disc list-inside mb-3 space-y-1">
            <li>Brand and project data cannot be loaded or saved</li>
            <li>Conversation history will not persist</li>
            <li>Test history will not be saved</li>
          </ul>
          <p className="text-sm text-amber-600 dark:text-amber-500">
            AI agents are still functional - you can test agents, but results won't be saved.
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-800/30 hover:bg-amber-200 dark:hover:bg-amber-800/50 text-amber-800 dark:text-amber-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  );
}
