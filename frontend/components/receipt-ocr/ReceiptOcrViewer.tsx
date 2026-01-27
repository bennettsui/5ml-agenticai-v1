'use client';

import { useEffect, useState } from 'react';
import OcrImageOverlay from './OcrImageOverlay';
import { Calendar, DollarSign, FileText, Store, Tag, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface OcrBox {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

interface StructuredData {
  vendor: string;
  date: string;
  amount: number;
  currency: string;
  description?: string;
  receipt_number?: string;
  payment_method?: string;
  category?: string;
  confidence: number;
}

interface ReceiptOcrData {
  receipt_id: string;
  image_url: string;
  image_filename: string;
  ocr_boxes: OcrBox[];
  structured_data: StructuredData;
  raw_text: string;
}

interface ReceiptOcrViewerProps {
  receiptId: string;
  apiBaseUrl?: string;
}

export default function ReceiptOcrViewer({
  receiptId,
  apiBaseUrl = '/api/receipts',
}: ReceiptOcrViewerProps) {
  const [data, setData] = useState<ReceiptOcrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightText, setHighlightText] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    fetchOcrData();
  }, [receiptId]);

  const fetchOcrData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/${receiptId}/ocr-data`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch OCR data');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleBoxClick = (box: OcrBox) => {
    console.log('Clicked box:', box);
    setHighlightText(box.text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading OCR data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
          <div>
            <h3 className="font-semibold text-red-800">Error Loading Receipt</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { structured_data, ocr_boxes, image_url, raw_text } = data;
  const confidenceColor = structured_data.confidence >= 0.8 ? 'text-green-600' : 'text-yellow-600';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Image with OCR Overlay */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Receipt Image</h3>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${confidenceColor}`}>
                Confidence: {Math.round(structured_data.confidence * 100)}%
              </span>
              {structured_data.confidence >= 0.8 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              )}
            </div>
          </div>

          <div className="overflow-auto border border-gray-200 rounded-lg bg-gray-50 p-4">
            <OcrImageOverlay
              imageUrl={image_url}
              boxes={ocr_boxes}
              showLabels={true}
              highlightText={highlightText}
              onBoxClick={handleBoxClick}
            />
          </div>

          {highlightText && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <strong>Selected:</strong> "{highlightText}"
              <button
                onClick={() => setHighlightText(null)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Structured Data */}
      <div className="space-y-4">
        {/* Extracted Information */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Extracted Data</h3>

          <div className="space-y-3">
            <DataField
              icon={<Store className="w-4 h-4" />}
              label="Vendor"
              value={structured_data.vendor}
            />

            <DataField
              icon={<Calendar className="w-4 h-4" />}
              label="Date"
              value={new Date(structured_data.date).toLocaleDateString()}
            />

            <DataField
              icon={<DollarSign className="w-4 h-4" />}
              label="Amount"
              value={`${structured_data.currency} ${structured_data.amount.toFixed(2)}`}
              highlight
            />

            {structured_data.description && (
              <DataField
                icon={<FileText className="w-4 h-4" />}
                label="Description"
                value={structured_data.description}
              />
            )}

            {structured_data.category && (
              <DataField
                icon={<Tag className="w-4 h-4" />}
                label="Category"
                value={structured_data.category}
              />
            )}

            {structured_data.receipt_number && (
              <DataField
                icon={<FileText className="w-4 h-4" />}
                label="Receipt #"
                value={structured_data.receipt_number}
              />
            )}

            {structured_data.payment_method && (
              <DataField
                icon={<FileText className="w-4 h-4" />}
                label="Payment"
                value={structured_data.payment_method}
              />
            )}
          </div>
        </div>

        {/* Raw OCR Text */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-semibold text-gray-800">Raw OCR Text</h3>
            <span className="text-sm text-gray-500">{showRawText ? 'Hide' : 'Show'}</span>
          </button>

          {showRawText && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
              {raw_text}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">OCR Statistics</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Words:</span>
              <span className="ml-1 font-semibold">{ocr_boxes.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Confidence:</span>
              <span className={`ml-1 font-semibold ${confidenceColor}`}>
                {Math.round(structured_data.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataField({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2 ${highlight ? 'bg-blue-50 -mx-2 px-2 py-1 rounded' : ''}`}>
      <div className="text-gray-500 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
        <div className={`text-sm ${highlight ? 'font-semibold text-blue-900' : 'text-gray-900'} break-words`}>
          {value}
        </div>
      </div>
    </div>
  );
}
