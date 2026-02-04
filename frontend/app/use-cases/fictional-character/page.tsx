'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, CameraOff, Mic, MicOff, Send, Sparkles, User, Volume2, RefreshCw } from 'lucide-react';

// Character presets
const CHARACTERS = [
  {
    id: 'uncle-peanut',
    name: '老花生叔',
    description: '香港中年大叔，毒舌評論員',
    avatar: '/avatars/uncle-peanut.png',
    color: 'from-amber-500 to-orange-600',
    overlayStyle: 'cartoon-uncle',
  },
  {
    id: 'news-anchor',
    name: '新聞主播',
    description: '專業新聞主播風格',
    avatar: '/avatars/news-anchor.png',
    color: 'from-blue-500 to-cyan-600',
    overlayStyle: 'professional',
  },
  {
    id: 'anime-girl',
    name: 'アニメキャラ',
    description: 'Anime-style character',
    avatar: '/avatars/anime.png',
    color: 'from-pink-500 to-rose-600',
    overlayStyle: 'anime',
  },
];

// Face filter effects
const FILTER_EFFECTS = {
  none: '',
  cartoon: 'saturate(1.3) contrast(1.1)',
  anime: 'saturate(1.5) contrast(1.2) brightness(1.1)',
  noir: 'grayscale(1) contrast(1.3)',
  vintage: 'sepia(0.4) saturate(1.2)',
  cyberpunk: 'saturate(1.8) hue-rotate(20deg) contrast(1.2)',
};

export default function FictionalCharacterPage() {
  // Camera state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Character & effect state
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);
  const [activeFilter, setActiveFilter] = useState<keyof typeof FILTER_EFFECTS>('cartoon');
  const [showOverlay, setShowOverlay] = useState(true);

  // Audio state
  const [isMicOn, setIsMicOn] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Text transformation state
  const [inputText, setInputText] = useState('');
  const [transformedText, setTransformedText] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);

  // Start camera
  const startCamera = useCallback(async () => {
    setIsCameraLoading(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      streamRef.current = stream;
      setIsCameraOn(true);
      startCanvasRendering();
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(
        err instanceof Error
          ? err.message
          : 'Failed to access camera. Please allow camera permissions.'
      );
    } finally {
      setIsCameraLoading(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  }, []);

  // Canvas rendering loop with effects
  const startCanvasRendering = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!video.paused && !video.ended) {
        // Set canvas size to match video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        // Apply filter
        ctx.filter = FILTER_EFFECTS[activeFilter] || 'none';

        // Mirror the video (selfie mode)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        // Draw character overlay if enabled
        if (showOverlay) {
          drawCharacterOverlay(ctx, canvas.width, canvas.height);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  }, [activeFilter, showOverlay]);

  // Draw character overlay elements
  const drawCharacterOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Add character-specific overlays
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, height - 60, width, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🎭 ${selectedCharacter.name}`, width / 2, height - 30);

    // Add frame border based on character
    ctx.strokeStyle = selectedCharacter.id === 'uncle-peanut'
      ? '#f59e0b'
      : selectedCharacter.id === 'anime-girl'
        ? '#ec4899'
        : '#3b82f6';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    // Add corner decorations
    const cornerSize = 30;
    ctx.fillStyle = ctx.strokeStyle;

    // Top-left
    ctx.fillRect(0, 0, cornerSize, 4);
    ctx.fillRect(0, 0, 4, cornerSize);

    // Top-right
    ctx.fillRect(width - cornerSize, 0, cornerSize, 4);
    ctx.fillRect(width - 4, 0, 4, cornerSize);

    // Bottom-left
    ctx.fillRect(0, height - 4, cornerSize, 4);
    ctx.fillRect(0, height - cornerSize, 4, cornerSize);

    // Bottom-right
    ctx.fillRect(width - cornerSize, height - 4, cornerSize, 4);
    ctx.fillRect(width - 4, height - cornerSize, 4, cornerSize);
  };

  // Update rendering when filter or overlay changes
  useEffect(() => {
    if (isCameraOn && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      startCanvasRendering();
    }
  }, [activeFilter, showOverlay, selectedCharacter, isCameraOn, startCanvasRendering]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Toggle microphone
  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    setIsListening(!isMicOn);
  };

  // Transform text to character voice
  const transformText = async () => {
    if (!inputText.trim()) return;

    setIsTransforming(true);
    setTransformedText('');

    // Simulate transformation (in production, this would call Claude API)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Demo transformation based on character
    let transformed = '';
    if (selectedCharacter.id === 'uncle-peanut') {
      transformed = `【老花生叔風格】\n\n各位觀眾朋友，${inputText}\n\n呢個就係我嘅睇法啦，你哋點睇呢？`;
    } else if (selectedCharacter.id === 'news-anchor') {
      transformed = `【新聞主播風格】\n\n各位觀眾晚上好，以下是今日重點：\n\n${inputText}\n\n以上是本台報導。`;
    } else {
      transformed = `【アニメキャラ】\n\nみんな〜！${inputText}\n\nよろしくお願いします！✨`;
    }

    setTransformedText(transformed);
    setIsTransforming(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <h1 className="text-lg font-bold text-white">Live Fictional Character</h1>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Camera Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Container */}
            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
              <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
                {/* Hidden video element */}
                <video
                  ref={videoRef}
                  className="hidden"
                  playsInline
                  muted
                />

                {/* Canvas with effects */}
                <canvas
                  ref={canvasRef}
                  className={`w-full h-full object-cover ${isCameraOn ? 'block' : 'hidden'}`}
                />

                {/* Camera off state */}
                {!isCameraOn && !isCameraLoading && (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                      <CameraOff className="w-12 h-12 text-slate-500" />
                    </div>
                    <p className="text-slate-400 mb-4">Camera is off</p>
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Camera className="w-5 h-5" />
                      Start Camera
                    </button>
                  </div>
                )}

                {/* Loading state */}
                {isCameraLoading && (
                  <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Starting camera...</p>
                  </div>
                )}

                {/* Error state */}
                {cameraError && (
                  <div className="text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4">
                      <CameraOff className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-red-400 mb-4">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Live indicator */}
                {isCameraOn && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-white text-sm font-medium">LIVE</span>
                  </div>
                )}

                {/* Mic indicator */}
                {isMicOn && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-green-600 rounded-full">
                    <Mic className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-medium">Recording</span>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={isCameraOn ? stopCamera : startCamera}
                      disabled={isCameraLoading}
                      className={`p-3 rounded-full transition-colors ${
                        isCameraOn
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      {isCameraOn ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={toggleMic}
                      disabled={!isCameraOn}
                      className={`p-3 rounded-full transition-colors ${
                        isMicOn
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      } ${!isCameraOn ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Filter selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Filter:</span>
                    <select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value as keyof typeof FILTER_EFFECTS)}
                      disabled={!isCameraOn}
                      className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-rose-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="none">None</option>
                      <option value="cartoon">Cartoon</option>
                      <option value="anime">Anime</option>
                      <option value="noir">Noir</option>
                      <option value="vintage">Vintage</option>
                      <option value="cyberpunk">Cyberpunk</option>
                    </select>
                  </div>

                  {/* Overlay toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOverlay}
                      onChange={(e) => setShowOverlay(e.target.checked)}
                      disabled={!isCameraOn}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-800"
                    />
                    <span className="text-slate-400 text-sm">Show Overlay</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Text Transformation */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-rose-500" />
                Voice Transformation
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-sm mb-1 block">Your message (raw intent):</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type what you want to say..."
                    className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-700 focus:border-rose-500 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                <button
                  onClick={transformText}
                  disabled={isTransforming || !inputText.trim()}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isTransforming ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Transforming...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Transform to {selectedCharacter.name}
                    </>
                  )}
                </button>

                {transformedText && (
                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <label className="text-rose-400 text-sm mb-2 block">Character output:</label>
                    <p className="text-white whitespace-pre-wrap">{transformedText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Character Selection */}
          <div className="space-y-4">
            {/* Character Selector */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-rose-500" />
                Select Character
              </h3>

              <div className="space-y-3">
                {CHARACTERS.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharacter(char)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedCharacter.id === char.id
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${char.color} flex items-center justify-center text-white text-xl`}>
                        🎭
                      </div>
                      <div>
                        <div className="text-white font-medium">{char.name}</div>
                        <div className="text-slate-400 text-sm">{char.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Panel */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3">System Status</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Camera</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isCameraOn ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {isCameraOn ? 'Active' : 'Off'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Microphone</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isMicOn ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {isMicOn ? 'Recording' : 'Off'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Filter</span>
                  <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs font-medium capitalize">
                    {activeFilter}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Character</span>
                  <span className="px-2 py-1 bg-rose-900 text-rose-400 rounded text-xs font-medium">
                    {selectedCharacter.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-2">How to Use</h3>
              <ol className="text-slate-400 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">1.</span>
                  Click "Start Camera" to enable your webcam
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">2.</span>
                  Select a character persona from the right panel
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">3.</span>
                  Choose a visual filter for your video feed
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">4.</span>
                  Type your message and transform it to character voice
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
