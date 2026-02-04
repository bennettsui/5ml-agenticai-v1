'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, CameraOff, Mic, MicOff, Send, Sparkles, User, Volume2, RefreshCw, Settings, AudioWaveform, Radio, StopCircle, Play } from 'lucide-react';

// Character presets
const CHARACTERS = [
  {
    id: 'uncle-peanut',
    name: '老花生叔',
    description: '香港中年大叔，毒舌評論員',
    color: 'from-amber-500 to-orange-600',
    pitchShift: -4,
  },
  {
    id: 'news-anchor',
    name: '新聞主播',
    description: '專業新聞主播風格',
    color: 'from-blue-500 to-cyan-600',
    pitchShift: 0,
  },
  {
    id: 'anime-girl',
    name: 'アニメキャラ',
    description: 'Anime-style character',
    color: 'from-pink-500 to-rose-600',
    pitchShift: 6,
  },
];

// Face filter effects
const FILTER_EFFECTS: Record<string, string> = {
  none: '',
  cartoon: 'saturate(1.3) contrast(1.1)',
  anime: 'saturate(1.5) contrast(1.2) brightness(1.1)',
  noir: 'grayscale(1) contrast(1.3)',
  vintage: 'sepia(0.4) saturate(1.2)',
  cyberpunk: 'saturate(1.8) hue-rotate(20deg) contrast(1.2)',
};

type VoiceMode = 'text' | 'realtime';

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
  const [activeFilter, setActiveFilter] = useState<string>('cartoon');
  const [showOverlay, setShowOverlay] = useState(true);

  // Voice conversion state
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('realtime');
  const [isVoiceConverting, setIsVoiceConverting] = useState(false);
  const [voiceConversionStatus, setVoiceConversionStatus] = useState<string>('Ready');
  const [pitchShift, setPitchShift] = useState(-4);

  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);

  // Text transformation state
  const [inputText, setInputText] = useState('');
  const [transformedText, setTransformedText] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs for overlay drawing (to avoid stale closure)
  const selectedCharacterRef = useRef(selectedCharacter);
  const showOverlayRef = useRef(showOverlay);
  const activeFilterRef = useRef(activeFilter);

  // Update refs when state changes
  useEffect(() => {
    selectedCharacterRef.current = selectedCharacter;
  }, [selectedCharacter]);

  useEffect(() => {
    showOverlayRef.current = showOverlay;
  }, [showOverlay]);

  useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);

  // Update pitch shift when character changes
  useEffect(() => {
    setPitchShift(selectedCharacter.pitchShift);
  }, [selectedCharacter]);

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

      // Start rendering after a short delay to ensure video is ready
      setTimeout(() => {
        startCanvasRendering();
      }, 100);

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
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  }, []);

  // Canvas rendering loop - uses refs to avoid stale closures
  const startCanvasRendering = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (video.readyState >= 2 && !video.paused && !video.ended) {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        // Set canvas size
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        // Get current values from refs
        const currentFilter = activeFilterRef.current;
        const currentShowOverlay = showOverlayRef.current;
        const currentCharacter = selectedCharacterRef.current;

        // Get filter value
        const filterValue = FILTER_EFFECTS[currentFilter] || '';

        // Mirror and draw video with filter
        ctx.save();
        ctx.filter = filterValue || 'none'; // Apply filter inside save block
        ctx.scale(-1, 1);
        ctx.drawImage(video, -width, 0, width, height);
        ctx.restore(); // Restores transform AND filter

        // Draw overlay
        if (currentShowOverlay) {
          const borderColor = currentCharacter.id === 'uncle-peanut'
            ? '#f59e0b'
            : currentCharacter.id === 'anime-girl'
              ? '#ec4899'
              : '#3b82f6';

          // Bottom bar
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, height - 60, width, 60);

          // Character name
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`🎭 ${currentCharacter.name}`, width / 2, height - 30);

          // Border
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 4;
          ctx.strokeRect(2, 2, width - 4, height - 4);

          // Corners
          const cs = 30;
          ctx.fillStyle = borderColor;
          ctx.fillRect(0, 0, cs, 4);
          ctx.fillRect(0, 0, 4, cs);
          ctx.fillRect(width - cs, 0, cs, 4);
          ctx.fillRect(width - 4, 0, 4, cs);
          ctx.fillRect(0, height - 4, cs, 4);
          ctx.fillRect(0, height - cs, 4, cs);
          ctx.fillRect(width - cs, height - 4, cs, 4);
          ctx.fillRect(width - 4, height - cs, 4, cs);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopVoiceConversion();
    };
  }, [stopCamera]);

  // Start voice conversion with character-specific audio effects
  const startVoiceConversion = async () => {
    try {
      setIsVoiceConverting(true);
      setVoiceConversionStatus('Starting microphone...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;

      // Create audio context
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      const ctx = audioContextRef.current;

      // Resume audio context if suspended (required by browsers)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Create source from microphone
      sourceNodeRef.current = ctx.createMediaStreamSource(stream);

      // Create gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.5;
      gainNodeRef.current = gainNode;

      // Create character-specific audio effects
      const filters: BiquadFilterNode[] = [];

      if (selectedCharacter.id === 'uncle-peanut') {
        // Deep voice: boost low frequencies, reduce highs
        const lowBoost = ctx.createBiquadFilter();
        lowBoost.type = 'lowshelf';
        lowBoost.frequency.value = 300;
        lowBoost.gain.value = 8; // Boost bass
        filters.push(lowBoost);

        const highCut = ctx.createBiquadFilter();
        highCut.type = 'highshelf';
        highCut.frequency.value = 3000;
        highCut.gain.value = -4; // Reduce treble
        filters.push(highCut);

        gainNode.gain.value = 2.0;
      } else if (selectedCharacter.id === 'anime-girl') {
        // High-pitched voice: boost high frequencies, reduce lows
        const highBoost = ctx.createBiquadFilter();
        highBoost.type = 'highshelf';
        highBoost.frequency.value = 2000;
        highBoost.gain.value = 10; // Boost treble significantly
        filters.push(highBoost);

        const lowCut = ctx.createBiquadFilter();
        lowCut.type = 'lowshelf';
        lowCut.frequency.value = 400;
        lowCut.gain.value = -6; // Reduce bass
        filters.push(lowCut);

        // Add presence boost for clarity
        const presence = ctx.createBiquadFilter();
        presence.type = 'peaking';
        presence.frequency.value = 4000;
        presence.Q.value = 1;
        presence.gain.value = 6;
        filters.push(presence);

        gainNode.gain.value = 1.8;
      } else {
        // News anchor: clear, professional voice
        const clarity = ctx.createBiquadFilter();
        clarity.type = 'peaking';
        clarity.frequency.value = 2500;
        clarity.Q.value = 1;
        clarity.gain.value = 4;
        filters.push(clarity);

        // Slight compression via limiting highs
        const limiter = ctx.createBiquadFilter();
        limiter.type = 'highshelf';
        limiter.frequency.value = 6000;
        limiter.gain.value = -2;
        filters.push(limiter);
      }

      filterNodesRef.current = filters;

      // Connect audio chain: source -> filters -> gain -> output
      let lastNode: AudioNode = sourceNodeRef.current;
      for (const filter of filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(gainNode);
      gainNode.connect(ctx.destination);

      setVoiceConversionStatus(`🔊 ${selectedCharacter.name} voice active`);
      console.log('Voice conversion started with', filters.length, 'filters');

    } catch (err) {
      console.error('Voice conversion error:', err);
      setVoiceConversionStatus(err instanceof Error ? err.message : 'Failed to start');
      setIsVoiceConverting(false);
    }
  };

  const stopVoiceConversion = useCallback(() => {
    // Disconnect all filter nodes
    for (const filter of filterNodesRef.current) {
      filter.disconnect();
    }
    filterNodesRef.current = [];

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    setIsVoiceConverting(false);
    setVoiceConversionStatus('Ready');
  }, []);

  // Transform text
  const transformText = async () => {
    if (!inputText.trim()) return;

    setIsTransforming(true);
    setTransformedText('');

    await new Promise((resolve) => setTimeout(resolve, 800));

    let transformed = '';
    if (selectedCharacter.id === 'uncle-peanut') {
      transformed = `各位觀眾朋友，${inputText}\n\n呢個就係我嘅睇法啦，你哋點睇呢？`;
    } else if (selectedCharacter.id === 'news-anchor') {
      transformed = `各位觀眾晚上好，以下是今日重點：\n\n${inputText}\n\n以上是本台報導。`;
    } else {
      transformed = `みんな〜！${inputText}\n\nよろしくお願いします！`;
    }

    setTransformedText(transformed);
    setIsTransforming(false);
  };

  // Text-to-speech function
  const speakText = () => {
    if (!transformedText || isSpeaking) return;

    // Check if speech synthesis is available
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(transformedText);

    // Set voice parameters based on character
    if (selectedCharacter.id === 'uncle-peanut') {
      utterance.rate = 0.9;
      utterance.pitch = 0.7;
      utterance.lang = 'zh-HK';
    } else if (selectedCharacter.id === 'news-anchor') {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'zh-TW';
    } else {
      utterance.rate = 1.1;
      utterance.pitch = 1.4;
      utterance.lang = 'ja-JP';
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
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
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-slate-400">Browser Mode</span>
            </div>
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
                <video
                  ref={videoRef}
                  className="hidden"
                  playsInline
                  muted
                />

                <canvas
                  ref={canvasRef}
                  className={`w-full h-full object-contain ${isCameraOn ? 'block' : 'hidden'}`}
                />

                {/* Camera off state */}
                {!isCameraOn && !isCameraLoading && !cameraError && (
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
                    <p className="text-red-400 mb-4">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
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

                {/* Voice indicator */}
                {isVoiceConverting && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-purple-600 rounded-full">
                    <AudioWaveform className="w-4 h-4 text-white animate-pulse" />
                    <span className="text-white text-sm font-medium">Voice Active</span>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    {/* Camera toggle - icon shows current state */}
                    <button
                      onClick={isCameraOn ? stopCamera : startCamera}
                      disabled={isCameraLoading}
                      className={`p-3 rounded-full transition-colors ${
                        isCameraOn
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                      title={isCameraOn ? 'Camera On - Click to stop' : 'Camera Off - Click to start'}
                    >
                      {isCameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                    </button>

                    {/* Mic toggle - icon shows current state */}
                    <button
                      onClick={isVoiceConverting ? stopVoiceConversion : startVoiceConversion}
                      className={`p-3 rounded-full transition-colors ${
                        isVoiceConverting
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                      title={isVoiceConverting ? 'Mic On - Click to stop' : 'Mic Off - Click to start'}
                    >
                      {isVoiceConverting ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Filter selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Filter:</span>
                    <select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value)}
                      className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-rose-500 focus:outline-none"
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
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-slate-400 text-sm">Show Overlay</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Voice Section */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-rose-500" />
                  Voice Transformation
                </h3>
                <div className="flex bg-slate-900 rounded-lg p-1">
                  <button
                    onClick={() => setVoiceMode('text')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      voiceMode === 'text' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Text → Speech
                  </button>
                  <button
                    onClick={() => setVoiceMode('realtime')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      voiceMode === 'realtime' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Live Voice
                  </button>
                </div>
              </div>

              {voiceMode === 'text' ? (
                <div className="space-y-3">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type what you want to say..."
                    className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-700 focus:border-rose-500 focus:outline-none resize-none"
                    rows={3}
                  />

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
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-rose-400 text-sm">Character output:</span>
                        <button
                          onClick={isSpeaking ? stopSpeaking : speakText}
                          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                            isSpeaking
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <StopCircle className="w-4 h-4" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Speak
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-white whitespace-pre-wrap">{transformedText}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
                    <p className="text-purple-300 text-sm">
                      🎤 Live voice monitoring. Click the microphone button above to start/stop.
                      Your voice will play through your speakers.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 text-sm">Status:</span>
                    <span className={`text-sm font-medium ${isVoiceConverting ? 'text-green-400' : 'text-slate-500'}`}>
                      {voiceConversionStatus}
                    </span>
                  </div>

                  <button
                    onClick={isVoiceConverting ? stopVoiceConversion : startVoiceConversion}
                    className={`w-full py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isVoiceConverting
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {isVoiceConverting ? (
                      <>
                        <StopCircle className="w-5 h-5" />
                        Stop Voice
                      </>
                    ) : (
                      <>
                        <Radio className="w-5 h-5" />
                        Start Voice
                      </>
                    )}
                  </button>

                  <p className="text-amber-400 text-xs text-center">
                    ⚠️ Use headphones to prevent feedback! Your voice will play through speakers.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Character Selection */}
          <div className="space-y-4">
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
                        <div className="text-slate-500 text-xs mt-1">
                          Pitch: {char.pitchShift > 0 ? `+${char.pitchShift}` : char.pitchShift}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Panel */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" />
                System Status
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Camera</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isCameraOn ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {isCameraOn ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Microphone</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isVoiceConverting ? 'bg-purple-900 text-purple-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {isVoiceConverting ? 'Active' : 'Off'}
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
                  Start camera (green = on)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">2.</span>
                  Select a character
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">3.</span>
                  For text: Type and click Transform, then Speak
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">4.</span>
                  For live: Click mic button (use headphones!)
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
