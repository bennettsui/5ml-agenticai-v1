'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, Upload, Sparkles, QrCode, Download, Share2, RotateCcw, ChevronRight, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import ThemePreview from './components/ThemePreview';

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

type Step = 'consent' | 'theme' | 'capture' | 'generating' | 'result';

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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const [transformationPhase, setTransformationPhase] = useState<'original' | 'transforming' | 'complete'>('original');
  const [showTransformAnimation, setShowTransformAnimation] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Refs for cleanup
  const replayTimersRef = useRef<NodeJS.Timeout[]>([]);

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

  // Cleanup timers and blob URLs on unmount
  useEffect(() => {
    return () => {
      // Clear replay timers
      replayTimersRef.current.forEach(timer => clearTimeout(timer));
      // Note: previewUrl cleanup happens in resetSession
    };
  }, []);

  // Auto-capture countdown effect
  useEffect(() => {
    if (autoCapture && cameraReady && countdown === null) {
      // Start countdown when camera is ready
      setCountdown(3);
    }
  }, [autoCapture, cameraReady, countdown]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      // Capture photo when countdown reaches 0
      capturePhotoAuto();
      setCountdown(null);
      setAutoCapture(false);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Transformation animation effect when result is shown
  useEffect(() => {
    if (currentStep === 'result' && showTransformAnimation && finalResult) {
      // Start transformation sequence
      setTransformationPhase('original');

      // Show original for 1 second
      const timer1 = setTimeout(() => {
        setTransformationPhase('transforming');
      }, 1000);

      // Complete transformation after 2 more seconds
      const timer2 = setTimeout(() => {
        setTransformationPhase('complete');
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [currentStep, showTransformAnimation, finalResult]);

  // Replay transformation animation
  const replayTransformation = () => {
    // Clear any existing replay timers
    replayTimersRef.current.forEach(timer => clearTimeout(timer));
    replayTimersRef.current = [];

    setTransformationPhase('original');
    const timer1 = setTimeout(() => setTransformationPhase('transforming'), 1000);
    const timer2 = setTimeout(() => setTransformationPhase('complete'), 3000);
    replayTimersRef.current = [timer1, timer2];
  };

  // Regenerate with same input image (optionally with different theme)
  const regenerateImage = async (newTheme?: string) => {
    if (!sessionId) return;

    const themeToUse = newTheme || selectedTheme;
    if (!themeToUse) return;

    try {
      setIsRegenerating(true);
      setShowThemeSelector(false);
      setProgressMessages([]);
      setCurrentProgress(0);
      setCurrentStep('generating');

      // Update selected theme if changed
      if (newTheme) {
        setSelectedTheme(newTheme);
      }

      const response = await fetch(`${API_BASE}/api/photo-booth/admin/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, theme_name: themeToUse }),
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
                // Update final result with new image
                setFinalResult({
                  branded_image_url: data.branded_image_url,
                  qr_code_url: data.qr_code_url,
                  qr_code_data_url: data.qr_code_data_url,
                  download_link: data.download_link,
                  share_link: data.share_link,
                });
                setShowTransformAnimation(true);
                setCurrentStep('result');
              } else if (data.type === 'error') {
                setError(data.error?.message || 'Regeneration failed');
                setCurrentStep('result');
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      setError('Regeneration failed');
      setCurrentStep('result');
    } finally {
      setIsRegenerating(false);
    }
  };

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

  // Create session and go to theme selection
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
        // Go to theme selection first
        setCurrentStep('theme');
      } else {
        setError(data.error || 'Failed to create session');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Start camera after theme selection with countdown
  const proceedToCapture = () => {
    if (!selectedTheme) return;
    setCurrentStep('capture');
    setAutoCapture(true);
    startCameraForCountdown();
  };

  // Start camera specifically for countdown flow
  const startCameraForCountdown = async () => {
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
      setAutoCapture(false);
    }
  };

  // Handle file upload
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Revoke old preview URL before creating new one
      setPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
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

  // Auto capture for countdown flow (same as capturePhoto but without error state)
  const capturePhotoAuto = () => {
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
                // Theme is already selected, go directly to generate
                generateImage();
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
    // Revoke the preview URL to free memory
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setQualityCheck(null);
    setAnalysis(null);
    setFinalResult(null);
    setProgressMessages([]);
    setCurrentProgress(0);
    setError(null);
    // Clear replay timers
    replayTimersRef.current.forEach(timer => clearTimeout(timer));
    replayTimersRef.current = [];
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
      <h2 className="text-xl font-semibold mb-4 text-white">
        {countdown !== null ? 'Get Ready!' : 'Capture Your Photo'}
      </h2>

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
              {/* Loading overlay when camera starting */}
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-300 text-sm">Starting camera...</p>
                  </div>
                </div>
              )}
              {/* Countdown overlay */}
              {countdown !== null && cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-9xl font-bold text-white animate-pulse drop-shadow-lg">
                      {countdown}
                    </div>
                    <p className="text-xl text-white mt-4">Strike a pose!</p>
                  </div>
                </div>
              )}
              {/* Show capture buttons only when not in auto-capture mode */}
              {!autoCapture && (
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
              )}
              {/* Cancel button during countdown */}
              {autoCapture && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button
                    onClick={() => {
                      setAutoCapture(false);
                      setCountdown(null);
                      stopCamera();
                    }}
                    className="bg-red-600 text-white py-2 px-6 rounded-full hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
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
      <h2 className="text-xl font-semibold mb-2 text-white">Choose Your Style</h2>
      <p className="text-sm text-gray-400 mb-4">Select a theme, then we&apos;ll take your photo</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
            className={`relative rounded-lg overflow-hidden transition-all ${
              selectedTheme === theme.id
                ? 'ring-4 ring-purple-500 scale-[1.02]'
                : 'hover:scale-[1.01]'
            }`}
          >
            {/* Theme Preview Image */}
            <ThemePreview
              themeId={theme.id}
              themeName={theme.name}
              size="md"
            />

            {/* Selected checkmark */}
            {selectedTheme === theme.id && (
              <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Theme info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-xs text-gray-300">{theme.country} &bull; {theme.era}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={proceedToCapture}
        disabled={!selectedTheme}
        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Camera className="w-5 h-5" />
        Take Photo
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm flex items-center gap-2 border border-red-800">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );

  const renderGeneratingStep = () => {
    // Get the latest progress message for the typewriter display
    const currentStatus = progressMessages.length > 0
      ? progressMessages[progressMessages.length - 1]
      : 'Initializing...';

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-center max-w-md w-full">
          <div className="mb-6">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto" />
          </div>

          <h2 className="text-xl font-semibold mb-2 text-white">Creating Your Portrait</h2>
          <p className="text-gray-400 mb-6">
            {themes.find((t) => t.id === selectedTheme)?.name || 'Selected'} theme
          </p>

          {/* Typewriter-style current status */}
          <div className="bg-slate-900 border border-purple-500/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-100" />
                <span className="w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-200" />
              </div>
              <span className="text-purple-300 font-mono text-sm animate-pulse">
                {currentStatus}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>

          {/* Progress log */}
          <div className="bg-slate-800 rounded-lg p-4 text-left text-sm max-h-40 overflow-y-auto border border-slate-700">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Generation Log</p>
            {progressMessages.map((msg, i) => (
              <div key={i} className="text-gray-400 mb-1 flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{msg}</span>
              </div>
            ))}
            {progressMessages.length === 0 && (
              <div className="text-gray-500 italic">Waiting for updates...</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResultStep = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-center text-white">
        {transformationPhase === 'original' && 'Preparing Transformation...'}
        {transformationPhase === 'transforming' && '✨ Transforming...'}
        {transformationPhase === 'complete' && 'Your Portrait is Ready!'}
      </h2>

      {finalResult && (
        <div className="space-y-6">
          {/* Transformation Animation Container */}
          <div className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
            <div className="relative rounded-lg overflow-hidden">
              {/* Original Image */}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Original"
                  className={`w-full h-auto rounded-lg absolute inset-0 transition-all duration-1000 ${
                    transformationPhase === 'original'
                      ? 'opacity-100 scale-100 blur-0'
                      : transformationPhase === 'transforming'
                      ? 'opacity-50 scale-105 blur-sm'
                      : 'opacity-0 scale-110 blur-lg'
                  }`}
                />
              )}

              {/* Disney-style Magical Transformation Overlay */}
              {transformationPhase === 'transforming' && (
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                  {/* Magical golden glow background */}
                  <div className="absolute inset-0 bg-gradient-radial from-amber-400/40 via-purple-500/30 to-blue-600/20 animate-pulse" />

                  {/* Swirling magic dust particles */}
                  <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          background: ['#FFD700', '#FF69B4', '#87CEEB', '#DDA0DD', '#F0E68C', '#E6E6FA'][i % 6],
                          left: `${10 + (i * 4.5)}%`,
                          top: `${20 + (i % 5) * 15}%`,
                          animation: `float-${i % 4} ${1.5 + (i % 3) * 0.5}s ease-in-out infinite`,
                          animationDelay: `${i * 0.1}s`,
                          boxShadow: '0 0 10px currentColor, 0 0 20px currentColor',
                        }}
                      />
                    ))}
                  </div>

                  {/* Central magic burst */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Outer rotating ring */}
                      <div
                        className="absolute -inset-8 border-4 border-dashed border-amber-300/60 rounded-full"
                        style={{ animation: 'spin 4s linear infinite' }}
                      />

                      {/* Inner rotating ring */}
                      <div
                        className="absolute -inset-4 border-2 border-dotted border-pink-300/80 rounded-full"
                        style={{ animation: 'spin 3s linear infinite reverse' }}
                      />

                      {/* Central sparkle icon */}
                      <Sparkles
                        className="w-20 h-20 text-amber-300 drop-shadow-lg"
                        style={{
                          animation: 'pulse 0.5s ease-in-out infinite',
                          filter: 'drop-shadow(0 0 20px #FFD700) drop-shadow(0 0 40px #FF69B4)',
                        }}
                      />

                      {/* Starburst rays */}
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-16 bg-gradient-to-t from-amber-400 via-yellow-200 to-transparent origin-bottom"
                          style={{
                            left: '50%',
                            bottom: '50%',
                            transform: `translateX(-50%) rotate(${i * 45}deg)`,
                            animation: `ray-pulse 1s ease-in-out infinite`,
                            animationDelay: `${i * 0.125}s`,
                            opacity: 0.7,
                          }}
                        />
                      ))}

                      {/* Floating stars around center */}
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={`star-${i}`}
                          className="absolute text-2xl"
                          style={{
                            left: `${50 + 40 * Math.cos(i * Math.PI / 3)}%`,
                            top: `${50 + 40 * Math.sin(i * Math.PI / 3)}%`,
                            transform: 'translate(-50%, -50%)',
                            animation: `twinkle 0.8s ease-in-out infinite`,
                            animationDelay: `${i * 0.15}s`,
                          }}
                        >
                          ✨
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sweeping magical light wave */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    style={{ animation: 'sweep 1.5s ease-in-out infinite' }}
                  />

                  {/* Second wave with different timing */}
                  <div
                    className="absolute inset-0 bg-gradient-to-l from-transparent via-amber-200/30 to-transparent"
                    style={{ animation: 'sweep 2s ease-in-out infinite', animationDelay: '0.75s' }}
                  />

                  {/* Magical text */}
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span
                      className="text-white text-lg font-medium px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/80 via-pink-500/80 to-amber-500/80"
                      style={{
                        animation: 'glow 1s ease-in-out infinite',
                        textShadow: '0 0 10px white',
                      }}
                    >
                      ✨ Magic in progress... ✨
                    </span>
                  </div>

                  <style jsx>{`
                    @keyframes sweep {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(100%); }
                    }
                    @keyframes float-0 {
                      0%, 100% { transform: translateY(0) rotate(0deg); opacity: 1; }
                      50% { transform: translateY(-30px) rotate(180deg); opacity: 0.6; }
                    }
                    @keyframes float-1 {
                      0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
                      50% { transform: translateY(-40px) scale(1.5); opacity: 1; }
                    }
                    @keyframes float-2 {
                      0%, 100% { transform: translate(0, 0); opacity: 1; }
                      50% { transform: translate(20px, -20px); opacity: 0.5; }
                    }
                    @keyframes float-3 {
                      0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
                      50% { transform: translateY(-25px) rotate(-180deg); opacity: 1; }
                    }
                    @keyframes ray-pulse {
                      0%, 100% { opacity: 0.3; transform: translateX(-50%) rotate(var(--rotation, 0deg)) scaleY(0.8); }
                      50% { opacity: 0.8; transform: translateX(-50%) rotate(var(--rotation, 0deg)) scaleY(1.2); }
                    }
                    @keyframes twinkle {
                      0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.8); }
                      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
                    }
                    @keyframes glow {
                      0%, 100% { box-shadow: 0 0 10px rgba(255,255,255,0.5); }
                      50% { box-shadow: 0 0 25px rgba(255,255,255,0.8), 0 0 50px rgba(255,182,193,0.5); }
                    }
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              )}

              {/* Transformed Image */}
              <img
                src={`${API_BASE}${finalResult.branded_image_url}`}
                alt={`Your ${themes.find((t) => t.id === selectedTheme)?.name || ''} Portrait`}
                className={`w-full h-auto rounded-lg transition-all duration-1000 ${
                  transformationPhase === 'original'
                    ? 'opacity-0 scale-90 blur-lg'
                    : transformationPhase === 'transforming'
                    ? 'opacity-50 scale-95 blur-sm'
                    : 'opacity-100 scale-100 blur-0'
                }`}
              />

              {/* Phase labels */}
              <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium transition-opacity duration-500 ${
                transformationPhase === 'original' ? 'opacity-100 bg-slate-600/80 text-white' : 'opacity-0'
              }`}>
                Original Photo
              </div>
              <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium transition-opacity duration-500 ${
                transformationPhase === 'complete' ? 'opacity-100 bg-purple-600/80 text-white' : 'opacity-0'
              }`}>
                AI Transformed
              </div>
            </div>

            {/* Theme name and replay button */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <p className="text-sm text-gray-400">
                {themes.find((t) => t.id === selectedTheme)?.name} Theme
              </p>
              {transformationPhase === 'complete' && (
                <button
                  onClick={replayTransformation}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Replay
                </button>
              )}
            </div>
          </div>

          {/* Generation process log */}
          {progressMessages.length > 0 && (
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Generation Process</h3>
              <div className="text-xs text-gray-500 space-y-1 max-h-32 overflow-y-auto">
                {progressMessages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Regenerate Section */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">Try a Different Style?</h3>
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                {showThemeSelector ? 'Hide themes' : 'Change theme'}
              </button>
            </div>

            {/* Theme selector for regeneration */}
            {showThemeSelector && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => regenerateImage(theme.id)}
                    disabled={isRegenerating}
                    className={`relative rounded-lg overflow-hidden aspect-square transition-all ${
                      theme.id === selectedTheme
                        ? 'ring-2 ring-purple-500'
                        : 'hover:ring-2 hover:ring-purple-400'
                    } ${isRegenerating ? 'opacity-50' : ''}`}
                  >
                    <ThemePreview
                      themeId={theme.id}
                      themeName={theme.name}
                      size="sm"
                    />
                    {theme.id === selectedTheme && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Regenerate button */}
            <button
              onClick={() => regenerateImage()}
              disabled={isRegenerating}
              className="w-full py-2 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerate with Same Photo
                </>
              )}
            </button>
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
            {['theme', 'capture', 'generating', 'result'].map((step, i) => (
              <div key={step} className="flex items-center">
                {i > 0 && <div className="w-8 h-0.5 bg-slate-700 mx-1" />}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep === step
                      ? 'bg-purple-600 text-white'
                      : ['theme', 'capture', 'generating', 'result'].indexOf(currentStep) > i
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
