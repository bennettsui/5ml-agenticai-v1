'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface DocumentUploaderProps {
  documents: string[];
  onDocumentsChange: (docs: string[]) => void;
  onExtractWithAI?: () => void;
  extracting?: boolean;
  disabled?: boolean;
}

export function DocumentUploader({
  documents,
  onDocumentsChange,
  onExtractWithAI,
  extracting = false,
  disabled = false,
}: DocumentUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const newDocs = files.map((f) => f.name);
    onDocumentsChange([...documents, ...newDocs]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newDocs = files.map((f) => f.name);
      onDocumentsChange([...documents, ...newDocs]);
    }
  };

  const removeDocument = (index: number) => {
    onDocumentsChange(documents.filter((_, i) => i !== index));
  };

  const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'PDF';
      case 'doc':
      case 'docx':
        return 'DOC';
      case 'ppt':
      case 'pptx':
        return 'PPT';
      case 'xls':
      case 'xlsx':
        return 'XLS';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return 'IMG';
      default:
        return 'FILE';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.svg,.txt,.md"
          disabled={disabled}
        />
        <div className="space-y-2">
          <div className="text-4xl text-gray-400">&#128196;</div>
          <p className="text-sm font-medium text-gray-600">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-gray-400">
            PDF, DOC, PPT, XLS, Images, and text files supported
          </p>
        </div>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Uploaded Documents ({documents.length})
            </h4>
            {onExtractWithAI && (
              <Button
                type="button"
                onClick={onExtractWithAI}
                disabled={disabled || extracting}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {extracting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Extracting...
                  </span>
                ) : (
                  'Extract with AI'
                )}
              </Button>
            )}
          </div>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {documents.map((doc, index) => (
              <li
                key={index}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-8 w-10 rounded bg-gray-100 text-xs font-bold text-gray-600">
                    {getFileIcon(doc)}
                  </span>
                  <span className="text-sm text-gray-800">{doc}</span>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDocument(index);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                    aria-label={`Remove ${doc}`}
                  >
                    &#10005;
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
