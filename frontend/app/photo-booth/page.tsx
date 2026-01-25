'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, Upload, Sparkles, QrCode, Download, Share2, RotateCcw, ChevronRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

// Types
interface Theme {
  id: string;
  name: string;
  country: string;
  description: string;
  era: string;
  image_url: string;
}

interface QualityCheck {
  is_valid: boolean;
  face_detected: boolean;
  face_count: number;
  face_confidence: number;
  lighting_quality: 'good' | 'moderate' | 'poor';
  warnings: string[];
  suggestions: string[];
}

interface AnalysisResult {
  face_analysis: {
    detected: boolean;
    count: number;
    confidence: number;
    expression?: string;
  };
  environment_analysis: {
    scene_type: string;
    lighting: string;
    background_complexity: string;
  };
  style_compatibility: {
    recommended_themes: string[];
    reasoning: string;
  };
}

interface FinalResult {
  branded_image_url: string;
  qr_code_url: string;
  qr_code_data_url: string;
  download_link: string;
  share_link: string;
}

type Step = 'consent' | 'capture' | 'theme' | 'generating' | 'result';

interface ProgressUpdate {
  type: 'start' | 'progress' | 'complete' | 'error';
  message?: string;
  step?: string;
  percentage?: number;
}

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : '';

export default function PhotoBoothPage() {
  // State
  const [currentStep, setCurrentStep] = useState<Step>('consent');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qualityCheck, setQualityCheck] = useState<QualityCheck | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Fetch themes on mount
  useEffect(() => {
    fetchThemes();
  }, []);

  // Attach camera stream to video element when both are available
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = cameraStream;

      const handleCanPlay = () => {
        setCameraReady(true);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.play().catch(console.error);

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [cameraStream, useCamera]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const fetchThemes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/photo-booth/themes`);
      const data = await response.json();
      if (data.success) {
        setThemes(data.themes);
      }
    } catch (err) {
      console.error('Failed to fetch themes:', err);
    }
  };

  // Create session
  const createSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/photo-booth/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent_agreed: true }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.session_id);
        setCurrentStep('capture');
      } else {
        setError(data.error || 'Failed to create session');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  // Camera functions
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      setUseCamera(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setUseCamera(false);
    setCameraReady(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
            setUploadedFile(file);
            setPreviewUrl(canvas.toDataURL('image/jpeg'));
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    } else {
      setError('Camera not ready. Please wait a moment and try again.');
    }
  };

  // Upload image
  const uploadImage = async () => {
    if (!sessionId || !uploadedFile) return;

    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('image', uploadedFile);

      const response = await fetch(`${API_BASE}/api/photo-booth/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setImageId(data.image_id);
        setQualityCheck(data.quality_check);
        await analyzeImage();
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze image with SSE
  const analyzeImage = async () => {
    if (!sessionId) return;

    setProgressMessages([]);
    setCurrentProgress(0);

    try {
      const response = await fetch(`${API_BASE}/api/photo-booth/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
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
              handleProgressUpdate(data);

              if (data.type === 'complete') {
                setAnalysis(data.analysis);
                if (data.recommended_theme) {
                  setSelectedTheme(data.recommended_theme);
                }
                setCurrentStep('theme');
              } else if (data.type === 'error') {
                setError(data.error?.message || 'Analysis failed');
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      setError('Analysis failed');
    }
  };

  // Generate image with SSE
  const generateImage = async () => {
    if (!sessionId || !selectedTheme) return;

    setCurrentStep('generating');
    setProgressMessages([]);
    setCurrentProgress(0);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/photo-booth/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, theme_name: selectedTheme }),
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
              handleProgressUpdate(data);

              if (data.type === 'complete') {
                await finalizeSession(data.image_id);
              } else if (data.type === 'error') {
                setError(data.error?.message || 'Generation failed');
                setCurrentStep('theme');
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      setError('Generation failed');
      setCurrentStep('theme');
    }
  };

  // Finalize session with SSE
  const finalizeSession = async (generatedImageId: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_BASE}/api/photo-booth/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, image_id: generatedImageId }),
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
              handleProgressUpdate(data);

              if (data.type === 'complete') {
                setFinalResult({
                  branded_image_url: data.branded_image_url,
                  qr_code_url: data.qr_code_url,
                  qr_code_data_url: data.qr_code_data_url,
                  download_link: data.download_link,
                  share_link: data.share_link,
                });
                setCurrentStep('result');
              } else if (data.type === 'error') {
                setError(data.error?.message || 'Finalization failed');
                setCurrentStep('theme');
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      setError('Finalization failed');
      setCurrentStep('theme');
    }
  };

  // Handle SSE progress updates
  const handleProgressUpdate = (data: ProgressUpdate) => {
    if (data.message) {
      setProgressMessages((prev) => [...prev, data.message!]);
    }
    if (data.percentage !== undefined) {
      setCurrentProgress(data.percentage);
    }
  };

  // Reset and start over
  const resetSession = () => {
    setCurrentStep('consent');
    setSessionId(null);
    setImageId(null);
    setSelectedTheme(null);
    setUploadedFile(null);
    setPreviewUrl(null);
    setQualityCheck(null);
    setAnalysis(null);
    setFinalResult(null);
    setProgressMessages([]);
    setCurrentProgress(0);
    setError(null);
    stopCamera();
  };

  // Render steps - DARK THEME
  const renderConsentStep = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-white">AI Photo Booth</h1>
        <p className="text-gray-300 mb-2">Transform yourself into 18th-century aristocracy</p>
        <p className="text-sm text-gray-400 mb-8">
          Step into the world of Versailles, Georgian England, or Imperial Russia with AI-powered portrait transformation.
        </p>

        <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left text-sm border border-slate-700">
          <h3 className="font-semibold mb-2 text-gray-200">By continuing, you agree to:</h3>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li>Your photo being processed by AI</li>
            <li>Generated images being stored temporarily</li>
            <li>5ML branding on final images</li>
          </ul>
        </div>

        <button
          onClick={createSession}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Session...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Start Photo Booth
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm flex items-center gap-2 border border-red-800">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );

  const renderCaptureStep = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Capture Your Photo</h2>

      {!previewUrl ? (
        <div className="space-y-4">
          {useCamera ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-black aspect-video"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-300 text-sm">Starting camera...</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className="bg-white text-gray-800 py-2 px-6 rounded-full font-semibold shadow-lg hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-5 h-5" />
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-slate-700 text-white py-2 px-4 rounded-full hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={startCamera}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-600 rounded-lg hover:border-purple-500 hover:bg-slate-800 transition-colors"
              >
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-gray-300">Use Camera</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-600 rounded-lg hover:border-purple-500 hover:bg-slate-800 transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-gray-300">Upload Photo</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-96 object-contain rounded-lg bg-slate-800"
            />
          </div>

          {qualityCheck && (
            <div className={`p-3 rounded-lg text-sm ${
              qualityCheck.is_valid ? 'bg-green-900/50 text-green-300 border border-green-800' : 'bg-yellow-900/50 text-yellow-300 border border-yellow-800'
            }`}>
              {qualityCheck.is_valid ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Photo quality check passed
                </div>
              ) : (
                <div>
                  <p className="font-semibold">Quality issues detected:</p>
                  <ul className="list-disc list-inside mt-1">
                    {qualityCheck.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                setUploadedFile(null);
                setPreviewUrl(null);
                setQualityCheck(null);
              }}
              className="flex-1 py-2 px-4 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>

            <button
              onClick={uploadImage}
              disabled={isLoading}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm flex items-center gap-2 border border-red-800">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );

  const renderThemeStep = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-2 text-white">Choose Your Theme</h2>
      {analysis?.style_compatibility?.reasoning && (
        <p className="text-sm text-gray-400 mb-4">{analysis.style_compatibility.reasoning}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedTheme === theme.id
                ? 'border-purple-500 bg-purple-900/30'
                : 'border-slate-700 hover:border-purple-400 bg-slate-800'
            } ${
              analysis?.style_compatibility?.recommended_themes?.includes(theme.id)
                ? 'ring-2 ring-amber-500'
                : ''
            }`}
          >
            <h3 className="font-semibold text-sm text-white">{theme.name}</h3>
            <p className="text-xs text-gray-400">{theme.country} &bull; {theme.era}</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{theme.description}</p>
            {analysis?.style_compatibility?.recommended_themes?.includes(theme.id) && (
              <span className="inline-block mt-2 text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded border border-amber-700">
                Recommended
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={generateImage}
        disabled={!selectedTheme}
        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        Generate Portrait
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm flex items-center gap-2 border border-red-800">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto" />
        </div>

        <h2 className="text-xl font-semibold mb-2 text-white">Creating Your Portrait</h2>
        <p className="text-gray-400 mb-6">
          {themes.find((t) => t.id === selectedTheme)?.name || 'Selected'} theme
        </p>

        {/* Progress bar */}
        <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        {/* Progress messages */}
        <div className="bg-slate-800 rounded-lg p-4 text-left text-sm max-h-48 overflow-y-auto border border-slate-700">
          {progressMessages.map((msg, i) => (
            <div key={i} className="text-gray-300 mb-1">
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResultStep = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-center text-white">Your Portrait is Ready!</h2>

      {finalResult && (
        <div className="space-y-6">
          {/* Generated image */}
          <div className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={`${API_BASE}${finalResult.branded_image_url}`}
                alt={`Your ${themes.find((t) => t.id === selectedTheme)?.name || '18th-Century'} Portrait`}
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  // Fallback to placeholder on error
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="aspect-[3/4] bg-gradient-to-b from-purple-900/50 to-slate-800 rounded-lg flex items-center justify-center">
                      <div class="text-center">
                        <p class="text-purple-300 font-medium">Your 18th-Century Portrait</p>
                        <p class="text-sm text-purple-400">${themes.find((t) => t.id === selectedTheme)?.name || ''}</p>
                      </div>
                    </div>
                  `;
                }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {themes.find((t) => t.id === selectedTheme)?.name} Theme
            </p>
          </div>

          {/* QR Code */}
          <div className="flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-md">
              {finalResult.qr_code_data_url ? (
                <img
                  src={finalResult.qr_code_data_url}
                  alt="QR Code"
                  className="w-32 h-32"
                />
              ) : (
                <QrCode className="w-32 h-32 text-gray-400" />
              )}
              <p className="text-xs text-center text-gray-500 mt-2">Scan to view/download</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href={finalResult.download_link}
              download
              className="flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
            >
              <Download className="w-5 h-5" />
              Download
            </a>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'My 5ML Photo Booth Portrait',
                    url: finalResult.share_link,
                  });
                } else {
                  navigator.clipboard.writeText(finalResult.share_link);
                  alert('Link copied to clipboard!');
                }
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 border border-purple-500 text-purple-400 rounded-lg font-semibold hover:bg-purple-900/30"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>

          {/* Start over button */}
          <button
            onClick={resetSession}
            className="w-full py-3 px-4 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Take Another Photo
          </button>
        </div>
      )}
    </div>
  );

  // Main render - DARK THEME
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span className="font-semibold text-white">5ML Photo Booth</span>
          </div>

          {currentStep !== 'consent' && (
            <button
              onClick={resetSession}
              className="text-sm text-gray-400 hover:text-white"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      {/* Progress indicator */}
      {currentStep !== 'consent' && (
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            {['capture', 'theme', 'generating', 'result'].map((step, i) => (
              <div key={step} className="flex items-center">
                {i > 0 && <div className="w-8 h-0.5 bg-slate-700 mx-1" />}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep === step
                      ? 'bg-purple-600 text-white'
                      : ['capture', 'theme', 'generating', 'result'].indexOf(currentStep) > i
                      ? 'bg-purple-800 text-purple-300'
                      : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-2xl mx-auto bg-slate-800 rounded-lg shadow-xl m-4 border border-slate-700">
        {currentStep === 'consent' && renderConsentStep()}
        {currentStep === 'capture' && renderCaptureStep()}
        {currentStep === 'theme' && renderThemeStep()}
        {currentStep === 'generating' && renderGeneratingStep()}
        {currentStep === 'result' && renderResultStep()}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-gray-500">
        Powered by 5ML AI
      </footer>
    </div>
  );
}
