'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Share2, Sparkles, ExternalLink } from 'lucide-react';

interface ShareData {
  image_url: string;
  download_link: string;
  theme_name?: string;
  created_at?: string;
}

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : '';

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
      <div className="text-center">
        <Sparkles className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
        <p className="text-gray-600">Loading your portrait...</p>
      </div>
    </div>
  );
}

function ShareContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchShareData(id);
    } else {
      setError('No image ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchShareData = async (imageId: string) => {
    try {
      setShareData({
        image_url: `${API_BASE}/api/photo-booth/download/${imageId}`,
        download_link: `${API_BASE}/api/photo-booth/download/${imageId}`,
        theme_name: '18th Century Portrait',
        created_at: new Date().toISOString(),
      });
      setLoading(false);
    } catch (err) {
      setError('Failed to load image');
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '5ML Photo Booth - 18th Century Portrait',
          text: 'Check out my AI-generated 18th century portrait!',
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">{error || 'Invalid share link'}</p>
          <a
            href="/photo-booth"
            className="text-purple-600 hover:underline"
          >
            Create your own portrait
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <span className="font-semibold">5ML Photo Booth</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-b from-purple-100 to-purple-200 p-8">
            <div className="aspect-[3/4] bg-white rounded-lg shadow-inner flex items-center justify-center">
              {shareData?.image_url ? (
                <img
                  src={shareData.image_url}
                  alt="18th Century Portrait"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="text-center p-8">
                          <div class="text-purple-600 text-6xl mb-4">🎨</div>
                          <p class="text-purple-700 font-medium">18th Century Portrait</p>
                          <p class="text-sm text-purple-500">${shareData?.theme_name || 'AI Generated'}</p>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="text-center">
                  <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                  <p className="text-purple-700 font-medium">18th Century Portrait</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <h1 className="text-xl font-semibold text-center mb-2">
              18th Century Portrait
            </h1>
            <p className="text-gray-500 text-center text-sm mb-6">
              Created with 5ML AI Photo Booth
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <a
                href={shareData?.download_link}
                download
                className="flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download
              </a>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-purple-700 font-medium mb-2">
                Want your own 18th century portrait?
              </p>
              <a
                href="/photo-booth"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold"
              >
                Try the Photo Booth
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-gray-500">
        <p>Powered by 5ML AI</p>
        <p className="mt-1">
          <a href="/photo-booth" className="text-purple-600 hover:underline">
            Create your own portrait
          </a>
        </p>
      </footer>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ShareContent />
    </Suspense>
  );
}
