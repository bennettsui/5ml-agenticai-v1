'use client';

import { useState, useEffect, useRef } from 'react';
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

interface ReceiptResult {
  receipt_id: string;
  receipt_date: string;
  vendor: string;
  description: string | null;
  amount: number | string;
  currency: string;
  tax_amount?: number | string | null;
  receipt_number?: string | null;
  payment_method?: string | null;
  category_id: string | null;
  category_name: string | null;
  categorization_confidence?: number | string | null;
  categorization_reasoning?: string | null;
  ocr_confidence?: number | string | null;
  ocr_warnings?: string[] | null;
  ocr_raw_text?: string | null;
  deductible?: boolean | null;
  deductible_amount?: number | string | null;
  non_deductible_amount?: number | string | null;
  requires_review?: boolean | null;
  reviewed?: boolean | null;
}

interface ExcelPreview {
  sheet_name: string;
  columns: string[];
  rows: Array<Array<string | number | null>>;
  total_rows: number;
}

interface ReceiptEditDraft {
  receipt_date: string;
  vendor: string;
  description: string;
  amount: string;
  currency: string;
  tax_amount: string;
  receipt_number: string;
  payment_method: string;
  category_id: string;
  category_name: string;
  deductible: boolean;
  deductible_amount: string;
  non_deductible_amount: string;
}

export default function ReceiptProcessor() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [clientName, setClientName] = useState("Man's Accounting Firm");
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'dropbox'>('upload');
  const [dropboxUrl, setDropboxUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [receiptResults, setReceiptResults] = useState<ReceiptResult[]>([]);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string>('');
  const [excelPreview, setExcelPreview] = useState<ExcelPreview | null>(null);
  const [isExcelLoading, setIsExcelLoading] = useState(false);
  const [excelError, setExcelError] = useState<string>('');
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ReceiptEditDraft | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [error, setError] = useState<string>('');
  const receiptFetchKeyRef = useRef<string>('');
  const excelFetchKeyRef = useRef<string>('');
  const isLocalhost = () => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  };
  const API_BASE = isLocalhost() ? (process.env.NEXT_PUBLIC_API_URL || '') : '';

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

  const toDisplayText = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (value && typeof value === 'object') return JSON.stringify(value);
    return '';
  };

  const formatAmount = (value: unknown): string => {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return '0.00';
    return parsed.toFixed(2);
  };

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toISOString().split('T')[0];
    const stringified = JSON.stringify(value);
    return stringified === undefined ? String(value) : stringified;
  };

  const toInputValue = (value: unknown, fallback = ''): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return String(value);
  };

  const loadExcelPreview = async (targetBatchId: string, force = false) => {
    if (!targetBatchId) return;
    if (!force && excelFetchKeyRef.current === targetBatchId) return;

    setIsExcelLoading(true);
    setExcelError('');

    try {
      const response = await fetch(apiUrl(`/api/receipts/batches/${targetBatchId}/excel-preview`));
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error ? formatErrorMessage(data.error) : 'Failed to fetch Excel preview');
      }

      setExcelPreview({
        sheet_name: data.sheet_name,
        columns: Array.isArray(data.columns) ? data.columns : [],
        rows: Array.isArray(data.rows) ? data.rows : [],
        total_rows: typeof data.total_rows === 'number' ? data.total_rows : 0,
      });
      excelFetchKeyRef.current = targetBatchId;
    } catch (err) {
      setExcelError(formatErrorMessage(err));
    } finally {
      setIsExcelLoading(false);
    }
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

  const apiUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

  // Real-time updates with WebSocket (fallback to polling)
  useEffect(() => {
    if (!batchId) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let ws: WebSocket | null = null;

    function startPolling() {
      if (pollInterval) return; // Already polling

      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(apiUrl(`/api/receipts/batches/${batchId}/status`));
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
          } else {
            setError(data.error ? formatErrorMessage(data.error) : 'Failed to fetch status');
          }
        } catch (err) {
          console.error('Error polling status:', err);
        }
      }, 2000);
    }

    // Start polling immediately to keep UI in sync even if WebSocket is quiet.
    startPolling();

    // Try WebSocket for real-time updates.
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
              console.log('📨 WebSocket update received:', nextData);
              if ('status' in nextData) {
                nextData.status = normalizeStatus(nextData.status);
              }
              if ('progress' in nextData) {
                nextData.progress = normalizeProgress(nextData.progress);
              }
              setBatchStatus(prev => {
                console.log('batchStatus prevData', prev);
                console.log('🔄 Merging batch status update:', { prev, nextData });
                if (prev) {
                  return { ...prev, ...nextData };
                }
                const fallback: BatchStatus = {
                  batch_id: batchId || '',
                  status: normalizeStatus(nextData.status),
                  progress: normalizeProgress(nextData.progress),
                  total_receipts: 0,
                  processed_receipts: 0,
                  failed_receipts: 0,
                  total_amount: 0,
                  deductible_amount: 0,
                  recent_logs: [],
                  updated_at: new Date().toISOString(),
                };
                return { ...fallback, ...nextData } as BatchStatus;
              });

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
        startPolling();
      };
    } catch (err) {
      console.warn('WebSocket not available, using polling', err);
      startPolling();
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe', batchId }));
        ws.close();
      }
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [batchId]);

  useEffect(() => {
    if (!batchId) return;
    const processedCount = batchStatus?.processed_receipts ?? 0;
    if (processedCount === 0) return;

    const statusValue = batchStatus ? normalizeStatus(batchStatus.status) : 'processing';
    const fetchKey = `${batchId}:${processedCount}:${statusValue}`;
    if (receiptFetchKeyRef.current === fetchKey) return;

    let cancelled = false;
    setIsReceiptLoading(true);
    setReceiptError('');

    const fetchReceiptDetails = async () => {
      try {
        const response = await fetch(apiUrl(`/api/receipts/batches/${batchId}`));
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error ? formatErrorMessage(data.error) : 'Failed to fetch receipt results');
        }

        if (!cancelled) {
          setReceiptResults(Array.isArray(data.receipts) ? data.receipts : []);
          receiptFetchKeyRef.current = fetchKey;
        }
      } catch (err) {
        if (!cancelled) {
          setReceiptError(formatErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setIsReceiptLoading(false);
        }
      }
    };

    fetchReceiptDetails();

    return () => {
      cancelled = true;
    };
  }, [batchId, batchStatus?.processed_receipts, batchStatus?.status]);

  useEffect(() => {
    if (!batchId || !batchStatus) return;
    if (normalizeStatus(batchStatus.status) !== 'completed') return;
    void loadExcelPreview(batchId);
  }, [batchId, batchStatus?.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    setBatchStatus(null);
    setReceiptResults([]);
    setReceiptError('');
    receiptFetchKeyRef.current = '';
    setExcelPreview(null);
    setExcelError('');
    excelFetchKeyRef.current = '';
    setEditingReceiptId(null);
    setEditDraft(null);
    setSaveError('');

    try {
      let response: Response;

      if (inputMode === 'dropbox') {
        if (!dropboxUrl.trim()) {
          setError('Please enter a Dropbox folder URL.');
          setIsProcessing(false);
          return;
        }
        response = await fetch(apiUrl('/api/receipts/process'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_name: clientName,
            dropbox_url: dropboxUrl.trim(),
            period_start: periodStart || null,
            period_end: periodEnd || null,
          }),
        });
      } else {
        if (uploadedFiles.length === 0) {
          setError('Please select at least one receipt image.');
          setIsProcessing(false);
          return;
        }

        const images = await Promise.all(
          uploadedFiles.map(async (file) => ({
            filename: file.name,
            data: await readFileAsBase64(file),
          }))
        );

        response = await fetch(apiUrl('/api/receipts/process-upload'), {
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
      }

      const data = await response.json();

      if (data.success) {
        setBatchId(data.batch_id);
        setBatchStatus({
          batch_id: data.batch_id,
          status: normalizeStatus(data.status),
          progress: 0,
          total_receipts: 0,
          processed_receipts: 0,
          failed_receipts: 0,
          total_amount: 0,
          deductible_amount: 0,
          recent_logs: [],
          updated_at: new Date().toISOString(),
        });
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
      window.location.href = apiUrl(`/api/receipts/batches/${batchId}/download`);
    }
  };

  const startEditingReceipt = (receipt: ReceiptResult) => {
    setEditingReceiptId(receipt.receipt_id);
    setEditDraft({
      receipt_date: toInputValue(receipt.receipt_date),
      vendor: toInputValue(receipt.vendor),
      description: toInputValue(receipt.description),
      amount: toInputValue(receipt.amount, '0'),
      currency: toInputValue(receipt.currency || 'HKD', 'HKD'),
      tax_amount: toInputValue(receipt.tax_amount, '0'),
      receipt_number: toInputValue(receipt.receipt_number),
      payment_method: toInputValue(receipt.payment_method),
      category_id: toInputValue(receipt.category_id),
      category_name: toInputValue(receipt.category_name),
      deductible: Boolean(receipt.deductible ?? true),
      deductible_amount: toInputValue(receipt.deductible_amount, '0'),
      non_deductible_amount: toInputValue(receipt.non_deductible_amount, '0'),
    });
    setSaveError('');
  };

  const cancelEditingReceipt = () => {
    setEditingReceiptId(null);
    setEditDraft(null);
    setSaveError('');
  };

  const handleSaveReceipt = async () => {
    if (!editingReceiptId || !editDraft) return;

    const parsedAmount = Number(editDraft.amount);
    const parsedDeductibleAmount = Number(editDraft.deductible_amount);
    const parsedNonDeductible = editDraft.non_deductible_amount.trim().length > 0
      ? Number(editDraft.non_deductible_amount)
      : Math.max(parsedAmount - parsedDeductibleAmount, 0);
    const parsedTaxAmount = editDraft.tax_amount.trim().length > 0
      ? Number(editDraft.tax_amount)
      : 0;

    if (!editDraft.receipt_date || !editDraft.vendor.trim()) {
      setSaveError('Receipt date and vendor are required.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || !Number.isFinite(parsedDeductibleAmount)) {
      setSaveError('Amount and deductible amount must be valid numbers.');
      return;
    }
    if (!Number.isFinite(parsedNonDeductible) || !Number.isFinite(parsedTaxAmount)) {
      setSaveError('Non-deductible and tax amounts must be valid numbers.');
      return;
    }
    if (!editDraft.currency.trim()) {
      setSaveError('Currency is required.');
      return;
    }
    if (!editDraft.category_id.trim() || !editDraft.category_name.trim()) {
      setSaveError('Category ID and name are required.');
      return;
    }

    setIsSavingEdit(true);
    setSaveError('');

    try {
      const response = await fetch(apiUrl(`/api/receipts/${editingReceiptId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt_date: editDraft.receipt_date,
          vendor: editDraft.vendor.trim(),
          description: editDraft.description.trim() || null,
          amount: parsedAmount,
          currency: editDraft.currency.trim().toUpperCase(),
          tax_amount: parsedTaxAmount,
          receipt_number: editDraft.receipt_number.trim() || null,
          payment_method: editDraft.payment_method.trim() || null,
          category_id: editDraft.category_id.trim(),
          category_name: editDraft.category_name.trim(),
          deductible: editDraft.deductible,
          deductible_amount: parsedDeductibleAmount,
          non_deductible_amount: parsedNonDeductible,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error ? formatErrorMessage(data.error) : 'Failed to save receipt');
      }

      const updatedReceipt = data.receipt as ReceiptResult;
      setReceiptResults(prev =>
        prev.map(item => item.receipt_id === updatedReceipt.receipt_id ? { ...item, ...updatedReceipt } : item)
      );

      setEditingReceiptId(null);
      setEditDraft(null);

      if (batchId && batchStatus && normalizeStatus(batchStatus.status) === 'completed') {
        excelFetchKeyRef.current = '';
        await loadExcelPreview(batchId, true);
      }
    } catch (err) {
      setSaveError(formatErrorMessage(err));
    } finally {
      setIsSavingEdit(false);
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Receipt Source
              </label>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="radio"
                    name="inputMode"
                    value="upload"
                    checked={inputMode === 'upload'}
                    onChange={() => setInputMode('upload')}
                    disabled={isProcessing}
                  />
                  Upload Images
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="radio"
                    name="inputMode"
                    value="dropbox"
                    checked={inputMode === 'dropbox'}
                    onChange={() => setInputMode('dropbox')}
                    disabled={isProcessing}
                  />
                  Dropbox Folder URL
                </label>
              </div>
            </div>

            {inputMode === 'upload' ? (
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
                    disabled={isProcessing}
                  />
                  <Upload className="absolute right-3 top-2.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Upload one or more receipt images (JPG, PNG, WEBP)
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="dropboxUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Dropbox Folder URL
                </label>
                <input
                  type="url"
                  id="dropboxUrl"
                  value={dropboxUrl}
                  onChange={(e) => setDropboxUrl(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="https://www.dropbox.com/sh/..."
                  disabled={isProcessing}
                />
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Paste a shared Dropbox folder link that contains receipt images.
                </p>
              </div>
            )}

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
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">{toDisplayText(error)}</p>
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

        {(receiptResults.length > 0 || isReceiptLoading || receiptError.length > 0) && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Receipt Results</h2>
              {isReceiptLoading && (
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading receipts...
                </div>
              )}
            </div>

            {receiptError.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Receipt Fetch Error</h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">{toDisplayText(receiptError)}</p>
                  </div>
                </div>
              </div>
            )}

            {receiptResults.length === 0 && !isReceiptLoading && receiptError.length === 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">No OCR results available yet.</p>
            )}

            <div className="space-y-4">
              {receiptResults.map((receipt) => {
                const vendorLabel = receipt.vendor || 'Unknown vendor';
                const dateLabel = receipt.receipt_date || 'Unknown date';
                const currencyLabel = receipt.currency || 'HKD';
                const amountLabel = `${currencyLabel} ${formatAmount(receipt.amount)}`;
                const descriptionLabel = receipt.description || 'No description provided.';
                const categoryLabel = receipt.category_name || 'Uncategorized';
                const categoryIdLabel = receipt.category_id ? ` (${receipt.category_id})` : '';
                const confidenceValue = typeof receipt.categorization_confidence === 'number'
                  ? receipt.categorization_confidence
                  : Number(receipt.categorization_confidence);
                const confidenceLabel = Number.isFinite(confidenceValue)
                  ? `${Math.round(confidenceValue * 100)}%`
                  : 'n/a';
                const contextualText = receipt.categorization_reasoning
                  ? receipt.categorization_reasoning
                  : `No contextual analysis recorded yet. Category: ${categoryLabel}${categoryIdLabel}. Confidence: ${confidenceLabel}.`;
                const ocrText = receipt.ocr_raw_text || 'No OCR result available yet.';
                const isEditing = editingReceiptId === receipt.receipt_id;

                return (
                  <div key={receipt.receipt_id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{vendorLabel}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{dateLabel}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{descriptionLabel}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{amountLabel}</div>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSaveReceipt}
                              disabled={isSavingEdit}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-400"
                            >
                              {isSavingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingReceipt}
                              disabled={isSavingEdit}
                              className="px-3 py-1 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditingReceipt(receipt)}
                            className="px-3 py-1 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            Edit Receipt
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing && editDraft && (
                      <div className="mt-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Receipt Date</label>
                            <input
                              type="date"
                              value={editDraft.receipt_date}
                              onChange={(e) => setEditDraft({ ...editDraft, receipt_date: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Vendor</label>
                            <input
                              type="text"
                              value={editDraft.vendor}
                              onChange={(e) => setEditDraft({ ...editDraft, vendor: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
                            <input
                              type="text"
                              value={editDraft.description}
                              onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editDraft.amount}
                              onChange={(e) => setEditDraft({ ...editDraft, amount: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Currency</label>
                            <input
                              type="text"
                              value={editDraft.currency}
                              onChange={(e) => setEditDraft({ ...editDraft, currency: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Tax / Service Charge</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editDraft.tax_amount}
                              onChange={(e) => setEditDraft({ ...editDraft, tax_amount: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Payment Method</label>
                            <input
                              type="text"
                              value={editDraft.payment_method}
                              onChange={(e) => setEditDraft({ ...editDraft, payment_method: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Receipt Number</label>
                            <input
                              type="text"
                              value={editDraft.receipt_number}
                              onChange={(e) => setEditDraft({ ...editDraft, receipt_number: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Category ID</label>
                            <input
                              type="text"
                              value={editDraft.category_id}
                              onChange={(e) => setEditDraft({ ...editDraft, category_id: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Category Name</label>
                            <input
                              type="text"
                              value={editDraft.category_name}
                              onChange={(e) => setEditDraft({ ...editDraft, category_name: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Deductible Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editDraft.deductible_amount}
                              onChange={(e) => setEditDraft({ ...editDraft, deductible_amount: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Non-Deductible Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editDraft.non_deductible_amount}
                              onChange={(e) => setEditDraft({ ...editDraft, non_deductible_amount: e.target.value })}
                              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editDraft.deductible}
                              onChange={(e) => setEditDraft({ ...editDraft, deductible: e.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-300">Deductible</span>
                          </div>
                        </div>
                        {saveError && (
                          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{saveError}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">OCR Result</h4>
                        <pre className="mt-2 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                          {ocrText}
                        </pre>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Contextual Analysis</h4>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {contextualText}
                        </p>
                        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          Category: {categoryLabel}{categoryIdLabel} • Confidence: {confidenceLabel}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {batchStatus && normalizeStatus(batchStatus.status) === 'completed' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Excel Preview</h2>
              {isExcelLoading && (
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading spreadsheet...
                </div>
              )}
            </div>

            {excelError.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Excel Preview Error</h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">{toDisplayText(excelError)}</p>
                  </div>
                </div>
              </div>
            )}

            {excelPreview && excelPreview.columns.length > 0 ? (
              <>
                <div className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                  Sheet: {excelPreview.sheet_name} • Rows: {excelPreview.total_rows}
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      <tr>
                        {excelPreview.columns.map((column, index) => (
                          <th key={`${column}-${index}`} className="px-3 py-2 font-semibold whitespace-nowrap">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {excelPreview.rows.map((row, rowIndex) => (
                        <tr key={`excel-row-${rowIndex}`} className="bg-white dark:bg-slate-800">
                          {excelPreview.columns.map((_, cellIndex) => (
                            <td key={`excel-cell-${rowIndex}-${cellIndex}`} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {formatCellValue(row[cellIndex])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {excelPreview.rows.length === 0 && !isExcelLoading && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">No rows found in the spreadsheet.</p>
                )}
              </>
            ) : (
              !isExcelLoading && excelError.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400">Excel preview will appear once the export is ready.</p>
              )
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
