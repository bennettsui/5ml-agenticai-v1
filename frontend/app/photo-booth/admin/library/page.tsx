'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Calendar, Clock, Cpu, Palette, Download, ChevronLeft, ChevronRight, Loader2, AlertCircle, Eye, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface GeneratedImage {
  image_id: string;
  session_id: string;
  image_type: string;
  image_path: string;
  theme: string;
  generation_time_ms: number;
  created_at: string;
  session_status: string;
  theme_name: string;
}

interface PaginatedResponse {
  success: boolean;
  images: GeneratedImage[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total_images: number;
    total_sessions: number;
    avg_generation_time_ms: number;
    themes_used: { [key: string]: number };
  };
}

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : '';

export default function PhotoBoothLibraryPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateProgress, setRegenerateProgress] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchImages();
  }, [page]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/api/photo-booth/admin/library?page=${page}&limit=${limit}`);
      const result = await response.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch images');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const regenerateImage = async (sessionId: string, theme?: string) => {
    try {
      setRegenerating(true);
      setRegenerateProgress(['Starting regeneration...']);

      const response = await fetch(`${API_BASE}/api/photo-booth/admin/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, theme_name: theme }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.message) {
                setRegenerateProgress(prev => [...prev, data.message]);
              }
              if (data.type === 'complete') {
                setRegenerateProgress(prev => [...prev, '✓ Regeneration complete!']);
                setTimeout(() => {
                  setRegenerating(false);
                  setSelectedImage(null);
                  fetchImages();
                }, 1500);
              } else if (data.type === 'error') {
                setRegenerateProgress(prev => [...prev, `❌ Error: ${data.error?.message}`]);
                setTimeout(() => setRegenerating(false), 2000);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      setRegenerateProgress(prev => [...prev, '❌ Failed to regenerate']);
      setTimeout(() => setRegenerating(false), 2000);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image? This cannot be undone.')) return;

    try {
      setDeleting(true);
      const response = await fetch(`${API_BASE}/api/photo-booth/admin/image/${imageId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setSelectedImage(null);
        fetchImages();
      } else {
        alert('Failed to delete image: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to delete image');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/photo-booth/admin" className="text-gray-400 hover:text-white">
                ← Back to Themes
              </Link>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">Photo Library</h1>
            <p className="text-sm text-gray-400">
              {data?.stats?.total_images || 0} images from {data?.stats?.total_sessions || 0} sessions
            </p>
          </div>
          {data?.stats && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Avg. Generation Time</p>
              <p className="text-lg font-semibold text-purple-400">
                {formatDuration(data.stats.avg_generation_time_ms)}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Stats Bar */}
      {data?.stats?.themes_used && Object.keys(data.stats.themes_used).length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Themes Used</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.stats.themes_used).map(([theme, count]) => (
                <div key={theme} className="px-3 py-1 bg-slate-700 rounded-full text-sm">
                  <span className="text-white">{theme}</span>
                  <span className="text-gray-400 ml-2">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-red-800">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-300">{error}</p>
          </div>
        ) : !data?.images?.length ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No images generated yet</p>
            <p className="text-sm text-gray-500 mt-2">Generated photos will appear here</p>
          </div>
        ) : (
          <>
            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {data.images.map((image) => (
                <div
                  key={image.image_id}
                  className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-purple-500 transition-colors cursor-pointer group relative"
                >
                  <div className="aspect-[3/4] bg-slate-700 relative" onClick={() => setSelectedImage(image)}>
                    <img
                      src={`${API_BASE}/api/photo-booth/image/${image.image_id}`}
                      alt={`Generated ${image.theme}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {/* Delete button overlay - appears on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteImage(image.image_id);
                      }}
                      className="absolute top-2 left-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-lg"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        image.image_type === 'branded' ? 'bg-purple-600 text-white' :
                        image.image_type === 'styled' ? 'bg-blue-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {image.image_type}
                      </span>
                    </div>
                  </div>
                  <div className="p-3" onClick={() => setSelectedImage(image)}>
                    <p className="text-sm font-medium text-white truncate">
                      {image.theme_name || image.theme || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(image.created_at)}
                    </div>
                    {image.generation_time_ms && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDuration(image.generation_time_ms)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-gray-400">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 gap-4 p-4">
              {/* Image */}
              <div className="bg-slate-700 rounded-lg overflow-hidden">
                <img
                  src={`${API_BASE}/api/photo-booth/image/${selectedImage.image_id}`}
                  alt={`Generated ${selectedImage.theme}`}
                  className="w-full h-auto"
                />
              </div>

              {/* Details */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">
                  {selectedImage.theme_name || selectedImage.theme || 'Unknown Theme'}
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-300">
                    <Palette className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Theme ID</p>
                      <p className="font-medium">{selectedImage.theme || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="font-medium">{formatDate(selectedImage.created_at)} at {formatTime(selectedImage.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-300">
                    <Clock className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Generation Time</p>
                      <p className="font-medium">{formatDuration(selectedImage.generation_time_ms)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-300">
                    <Cpu className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-sm text-gray-400">Model</p>
                      <p className="font-medium">gemini-2.0-flash-exp (nanobanana)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-300">
                    <ImageIcon className="w-5 h-5 text-pink-400" />
                    <div>
                      <p className="text-sm text-gray-400">Image Type</p>
                      <p className="font-medium capitalize">{selectedImage.image_type}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700 space-y-2">
                  <p className="text-xs text-gray-500">Session ID</p>
                  <p className="text-xs text-gray-400 font-mono break-all">{selectedImage.session_id}</p>
                  <p className="text-xs text-gray-500 mt-2">Image ID</p>
                  <p className="text-xs text-gray-400 font-mono break-all">{selectedImage.image_id}</p>
                </div>

                {/* Regenerate Progress */}
                {regenerating && (
                  <div className="bg-slate-900 rounded-lg p-3 border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      <span className="text-sm font-medium text-white">Regenerating...</span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                      {regenerateProgress.map((msg, i) => (
                        <div key={i}>{msg}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => regenerateImage(selectedImage.session_id, selectedImage.theme)}
                    disabled={regenerating || deleting}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {regenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Regenerate
                  </button>
                  <a
                    href={`${API_BASE}/api/photo-booth/image/${selectedImage.image_id}`}
                    download
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <button
                    onClick={() => deleteImage(selectedImage.image_id)}
                    disabled={regenerating || deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setRegenerating(false);
                      setRegenerateProgress([]);
                    }}
                    disabled={regenerating || deleting}
                    className="px-4 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700 disabled:opacity-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-gray-500">
        Photo Booth Library • 5ML AI
      </footer>
    </div>
  );
}
