'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';

interface BatchStatus {
  batch_id: string;
  status: string;
  progress: number;
  total_receipts: number;
  processed_receipts: number;
  failed_receipts: number;
  total_amount: number;
  deductible_amount: number;
  recent_logs: Array<{
    log_level: string;
    step: string;
    message: string;
    created_at: string;
  }>;
  updated_at: string;
}

export default function ReceiptProcessor() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [clientName, setClientName] = useState("Man's Accounting Firm");
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [error, setError] = useState<string>('');

  const formatErrorMessage = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      const message = (value as { message?: string }).message;
      const status = (value as { status?: string | number }).status;
      if (message && status !== undefined) return `${message} (status ${status})`;
      if (message) return message;
    }
    return 'Unexpected error occurred';
  };

  const readFileAsBase64 = (file: File): Promise<string> => (
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString() || '';
        const commaIndex = result.indexOf(',');
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    })
  );

  const normalizeStatus = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      const nested = (value as { status?: unknown }).status;
      if (typeof nested === 'string') return nested;
    }
    return 'processing';
  };

  const normalizeProgress = (value: unknown): number => {
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Real-time updates with WebSocket (fallback to polling)
  useEffect(() => {
    if (!batchId) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let ws: WebSocket | null = null;

    // Try WebSocket first
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected for real-time updates');
        ws?.send(JSON.stringify({ type: 'subscribe', batchId }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'update') {
            const { event: updateEvent, data } = message;

            if ((updateEvent === 'progress' || updateEvent === 'status') && data) {
              const nextData = (data && typeof data === 'object') ? { ...(data as Record<string, unknown>) } : {};
              if ('status' in nextData) {
                nextData.status = normalizeStatus(nextData.status);
              }
              if ('progress' in nextData) {
                nextData.progress = normalizeProgress(nextData.progress);
              }
              setBatchStatus(prev => prev ? { ...prev, ...nextData } as BatchStatus : nextData as BatchStatus);

              if (normalizeStatus(nextData.status) === 'completed' || normalizeStatus(nextData.status) === 'failed') {
                setIsProcessing(false);
              }
            } else if (updateEvent === 'completed') {
              setIsProcessing(false);
              ws?.close();
            }
          }
        } catch (err) {
          console.error('WebSocket message error:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error, falling back to polling', err);
        startPolling();
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (err) {
      console.warn('WebSocket not available, using polling', err);
      startPolling();
    }

    function startPolling() {
      if (pollInterval) return; // Already polling

      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/receipts/batches/${batchId}/status`);
          const data = await response.json();

          if (data.success) {
            const normalized = {
              ...data,
              status: normalizeStatus(data.status),
              progress: normalizeProgress(data.progress),
            } as BatchStatus;
            setBatchStatus(normalized);

            if (normalized.status === 'completed' || normalized.status === 'failed') {
              setIsProcessing(false);
              if (pollInterval) clearInterval(pollInterval);
            }
          }
        } catch (err) {
          console.error('Error polling status:', err);
        }
      }, 2000);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe', batchId }));
        ws.close();
      }
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [batchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    setBatchStatus(null);

    if (uploadedFiles.length === 0) {
      setError('Please select at least one receipt image.');
      setIsProcessing(false);
      return;
    }

    try {
      const images = await Promise.all(
        uploadedFiles.map(async (file) => ({
          filename: file.name,
          data: await readFileAsBase64(file),
        }))
      );

      const response = await fetch('/api/receipts/process-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: clientName,
          period_start: periodStart || null,
          period_end: periodEnd || null,
          images,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBatchId(data.batch_id);
      } else {
        setError(data.error ? formatErrorMessage(data.error) : 'Failed to start processing');
        setIsProcessing(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (batchId) {
      window.location.href = `/api/receipts/batches/${batchId}/download`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Receipt to P&L Automation</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Upload receipts and get a complete P&L statement in under 3 minutes
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Client Name
              </label>
              <input
                type="text"
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="Man's Accounting Firm"
                required
              />
            </div>

                <div>
                  <label htmlFor="receiptFiles" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Receipt Images
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="file"
                      id="receiptFiles"
                      accept="image/*"
                      multiple
                      onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}
                      className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white dark:bg-slate-700 text-slate-900 dark:text-white file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                      disabled={isProcessing}
                    />
                    <Upload className="absolute right-3 top-2.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Upload one or more receipt images (JPG, PNG, WEBP)
                  </p>
                </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="periodStart" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Period Start (Optional)
                </label>
                <input
                  type="date"
                  id="periodStart"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label htmlFor="periodEnd" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Period End (Optional)
                </label>
                <input
                  type="date"
                  id="periodEnd"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                  Process Receipts
                </>
              )}
            </button>
          </form>

          {error.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {batchStatus && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Processing Status</h2>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(normalizeStatus(batchStatus.status))}`}>
                {getStatusIcon(normalizeStatus(batchStatus.status))}
                <span className="text-sm font-medium capitalize">{normalizeStatus(batchStatus.status)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                <span>Progress</span>
                <span>{normalizeProgress(batchStatus.progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${normalizeProgress(batchStatus.progress)}%` }}
                />
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {batchStatus.processed_receipts} / {batchStatus.total_receipts} receipts processed
                {batchStatus.failed_receipts > 0 && (
                  <span className="text-red-600 dark:text-red-400 ml-2">({batchStatus.failed_receipts} failed)</span>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Amount</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  HKD {batchStatus.total_amount?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">Deductible</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  HKD {batchStatus.deductible_amount?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">Non-Deductible</div>
                <div className="text-2xl font-bold text-slate-600 dark:text-slate-300">
                  HKD {((batchStatus.total_amount || 0) - (batchStatus.deductible_amount || 0)).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Recent Logs */}
            {batchStatus.recent_logs && batchStatus.recent_logs.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recent Activity</h3>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {batchStatus.recent_logs.map((log, index) => (
                      <div key={index} className="text-sm">
                        <span className={`font-medium ${
                          log.log_level === 'error' ? 'text-red-600 dark:text-red-400' :
                          log.log_level === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-slate-600 dark:text-slate-400'
                        }`}>
                          [{log.step}]
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 ml-2">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Download Button */}
            {normalizeStatus(batchStatus.status) === 'completed' && (
              <button
                onClick={handleDownload}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Excel P&L Report
              </button>
            )}

            {/* Failed State */}
            {normalizeStatus(batchStatus.status) === 'failed' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Processing Failed</h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                      Please check the logs above and try again. If the problem persists, contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-400">
            <li>Upload your receipt images (JPG, PNG, WEBP)</li>
            <li>Click "Process Receipts" to start OCR and categorization</li>
            <li>Our AI extracts data from receipts using Claude Vision (supports Chinese + English)</li>
            <li>Receipts are automatically categorized with HK IRD compliance checks</li>
            <li>Download your complete P&L Excel report in under 3 minutes</li>
          </ol>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>Privacy:</strong> Images are processed securely and deleted immediately after export.
              All data stored in Hong Kong-compliant database with 7-year retention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
