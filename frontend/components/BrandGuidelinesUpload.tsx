'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, Loader2 } from 'lucide-react';

interface GuidelinesUploadProps {
  brandId: string;
  onUploadComplete?: (url: string) => void;
}

export default function BrandGuidelinesUpload({ brandId, onUploadComplete }: GuidelinesUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [guidelineUrl, setGuidelineUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only PDF, PNG, JPEG, or WebP files allowed');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('brandId', brandId);

      const response = await fetch('/api/brands/guidelines/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setGuidelineUrl(data.url);
      setFileName(file.name);
      onUploadComplete?.(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!guidelineUrl) return;

    setUploading(true);
    try {
      const response = await fetch('/api/brands/guidelines/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, url: guidelineUrl }),
      });

      if (!response.ok) throw new Error('Delete failed');

      setGuidelineUrl(null);
      setFileName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Brand Guidelines
      </h4>

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </div>
      )}

      {guidelineUrl ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-emerald-300">Guidelines uploaded</p>
                <p className="text-xs text-emerald-300/70">{fileName}</p>
              </div>
            </div>
            <button
              onClick={handleDelete}
              disabled={uploading}
              className="p-1 hover:bg-emerald-500/20 rounded text-emerald-400 disabled:opacity-50 transition-colors"
              title="Delete guidelines"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <a
            href={guidelineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs rounded-lg text-center transition-colors"
          >
            View Guidelines
          </a>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-600 hover:border-slate-500 rounded-lg p-6 text-center cursor-pointer transition-colors group"
        >
          <Upload className="w-8 h-8 text-slate-500 group-hover:text-slate-400 mx-auto mb-2 transition-colors" />
          <p className="text-xs font-medium text-slate-300 mb-1">Upload Brand Guidelines</p>
          <p className="text-xs text-slate-500">PDF, PNG, JPEG, or WebP (max 10MB)</p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>
      )}

      {uploading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <Loader2 className="w-3 h-3 animate-spin" />
          Uploading...
        </div>
      )}

      <p className="text-xs text-slate-500 mt-3">
        💡 Upload your brand guidelines (brand book, visual style guide, tone guide) to enable more detailed compliance checks
      </p>
    </div>
  );
}
