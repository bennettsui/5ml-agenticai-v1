'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, CameraOff, Mic, MicOff, Send, Sparkles, User, Volume2, RefreshCw, Settings, AudioWaveform, Radio, StopCircle, Play, Wifi, WifiOff, Server } from 'lucide-react';

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

// CSS filter effects (browser-only fallback)
const FILTER_EFFECTS: Record<string, string> = {
  none: '',
  cartoon: 'saturate(1.3) contrast(1.1)',
  anime: 'saturate(1.5) contrast(1.2) brightness(1.1)',
  noir: 'grayscale(1) contrast(1.3)',
  vintage: 'sepia(0.4) saturate(1.2)',
  cyberpunk: 'saturate(1.8) hue-rotate(20deg) contrast(1.2)',
};

type VoiceMode = 'text' | 'realtime';
type ServerStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export default function FictionalCharacterPage() {
  // ─── AI Server state ─────────────────────────────────────────────
  const [aiServerUrl, setAiServerUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<ServerStatus>('disconnected');
  const [serverCapabilities, setServerCapabilities] = useState<{
    faceSwap: boolean;
    voiceClone: boolean;
    characters: string[];
  }>({ faceSwap: false, voiceClone: false, characters: [] });
  const wsRef = useRef<WebSocket | null>(null);
  const [showServerSettings, setShowServerSettings] = useState(false);

  // ─── Camera state ────────────────────────────────────────────────
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  // Canvas for capturing frames to send to server
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ─── Character & effect state ────────────────────────────────────
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [showOverlay, setShowOverlay] = useState(true);
  const [faceSwapEnabled, setFaceSwapEnabled] = useState(true);

  // ─── Voice conversion state ──────────────────────────────────────
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('realtime');
  const [isVoiceConverting, setIsVoiceConverting] = useState(false);
  const [voiceConversionStatus, setVoiceConversionStatus] = useState<string>('Ready');

  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);

  // ─── Text transformation state ───────────────────────────────────
  const [inputText, setInputText] = useState('');
  const [transformedText, setTransformedText] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ─── Refs for render loop (avoid stale closures) ─────────────────
  const selectedCharacterRef = useRef(selectedCharacter);
  const showOverlayRef = useRef(showOverlay);
  const activeFilterRef = useRef(activeFilter);
  const faceSwapEnabledRef = useRef(faceSwapEnabled);
  const serverStatusRef = useRef(serverStatus);

  useEffect(() => { selectedCharacterRef.current = selectedCharacter; }, [selectedCharacter]);
  useEffect(() => { showOverlayRef.current = showOverlay; }, [showOverlay]);
  useEffect(() => { activeFilterRef.current = activeFilter; }, [activeFilter]);
  useEffect(() => { faceSwapEnabledRef.current = faceSwapEnabled; }, [faceSwapEnabled]);
  useEffect(() => { serverStatusRef.current = serverStatus; }, [serverStatus]);

  // ─── AI Server Connection ────────────────────────────────────────
  const connectToServer = useCallback(async (url: string) => {
    if (!url.trim()) return;

    // Disconnect existing
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setServerStatus('connecting');

    // First check server health via HTTP
    const httpUrl = url.replace('ws://', 'http://').replace('wss://', 'https://').replace('/ws/stream', '/');
    try {
      const res = await fetch(httpUrl);
      const data = await res.json();
      setServerCapabilities({
        faceSwap: data.face_swap === true,
        voiceClone: (data.voice_models || []).length > 0,
        characters: data.characters || [],
      });
    } catch {
      // Server might still accept WebSocket even if HTTP check fails
    }

    // Connect WebSocket
    const wsUrl = url.includes('/ws/stream') ? url : `${url}/ws/stream`;
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setServerStatus('connected');
        wsRef.current = ws;
        // Send ping to verify
        ws.send(JSON.stringify({ type: 'ping' }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleServerMessage(msg);
        } catch (e) {
          console.error('Failed to parse server message:', e);
        }
      };

      ws.onerror = () => {
        setServerStatus('error');
      };

      ws.onclose = () => {
        setServerStatus('disconnected');
        wsRef.current = null;
      };
    } catch {
      setServerStatus('error');
    }
  }, []);

  const disconnectFromServer = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setServerStatus('disconnected');
    setServerCapabilities({ faceSwap: false, voiceClone: false, characters: [] });
  }, []);

  // Handle messages from AI server
  const handleServerMessage = useCallback((msg: { type: string; image?: string; audio?: string }) => {
    if (msg.type === 'video_frame' && msg.image) {
      // Draw face-swapped frame to canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the face-swapped image
        ctx.drawImage(img, 0, 0);

        // Draw overlay on top
        const currentShowOverlay = showOverlayRef.current;
        const currentCharacter = selectedCharacterRef.current;
        if (currentShowOverlay) {
          drawOverlay(ctx, canvas.width, canvas.height, currentCharacter);
        }
      };
      img.src = 'data:image/jpeg;base64,' + msg.image;
    }

    if (msg.type === 'audio_chunk' && msg.audio) {
      // Play back voice-converted audio
      playConvertedAudio(msg.audio);
    }
  }, []);

  // Play converted audio from server
  const playConvertedAudio = useCallback((audioB64: string) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    try {
      const audioBytes = atob(audioB64);
      const buffer = new Float32Array(audioBytes.length / 4);
      const view = new DataView(new ArrayBuffer(audioBytes.length));
      for (let i = 0; i < audioBytes.length; i++) {
        view.setUint8(i, audioBytes.charCodeAt(i));
      }
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = view.getFloat32(i * 4, true);
      }

      const audioBuffer = ctx.createBuffer(1, buffer.length, ctx.sampleRate);
      audioBuffer.copyToChannel(buffer, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }, []);

  // Draw overlay on canvas
  const drawOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number, character: typeof CHARACTERS[0]) => {
    const borderColor = character.id === 'uncle-peanut'
      ? '#f59e0b'
      : character.id === 'anime-girl'
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
    ctx.fillText(`🎭 ${character.name}`, width / 2, height - 30);

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

    // "AI Face Swap" badge when server is connected
    if (serverStatusRef.current === 'connected' && faceSwapEnabledRef.current) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      const badgeWidth = 120;
      ctx.fillRect(width - badgeWidth - 10, 10, badgeWidth, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AI Face Swap', width - badgeWidth / 2 - 10, 24);
    }
  };

  // ─── Camera ──────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setIsCameraLoading(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      streamRef.current = stream;
      setIsCameraOn(true);

      // Create offscreen canvas for frame capture
      captureCanvasRef.current = document.createElement('canvas');

      setTimeout(() => { startCanvasRendering(); }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(
        err instanceof Error ? err.message : 'Failed to access camera. Please allow camera permissions.'
      );
    } finally {
      setIsCameraLoading(false);
    }
  }, []);

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
    captureCanvasRef.current = null;
    setIsCameraOn(false);
  }, []);

  // ─── Canvas rendering loop ───────────────────────────────────────
  const frameCountRef = useRef(0);

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

        const currentFilter = activeFilterRef.current;
        const currentShowOverlay = showOverlayRef.current;
        const currentCharacter = selectedCharacterRef.current;
        const isServerConnected = serverStatusRef.current === 'connected';
        const isFaceSwapOn = faceSwapEnabledRef.current;

        // If server connected and face swap enabled, send frames to server
        // Server will respond with face-swapped frames via handleServerMessage
        if (isServerConnected && isFaceSwapOn && wsRef.current?.readyState === WebSocket.OPEN) {
          frameCountRef.current++;

          // Send every 3rd frame to server (~10 FPS) to reduce bandwidth
          if (frameCountRef.current % 3 === 0) {
            const captureCanvas = captureCanvasRef.current;
            if (captureCanvas) {
              captureCanvas.width = width;
              captureCanvas.height = height;
              const captureCtx = captureCanvas.getContext('2d');
              if (captureCtx) {
                // Draw mirrored video to capture canvas
                captureCtx.save();
                captureCtx.scale(-1, 1);
                captureCtx.drawImage(video, -width, 0, width, height);
                captureCtx.restore();

                // Send as JPEG base64
                const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.7);
                const b64 = dataUrl.split(',')[1];
                wsRef.current.send(JSON.stringify({
                  type: 'video_frame',
                  character_id: currentCharacter.id,
                  image: b64,
                }));
              }
            }
          }

          // Still draw local preview (server response will overwrite)
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }
          ctx.save();
          ctx.filter = FILTER_EFFECTS[currentFilter] || 'none';
          ctx.scale(-1, 1);
          ctx.drawImage(video, -width, 0, width, height);
          ctx.restore();

          // Show "processing" indicator
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(0, 0, width, 30);
          ctx.fillStyle = '#10b981';
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.fillText('AI Processing...', 10, 20);

        } else {
          // Browser-only mode: just apply CSS filters
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          ctx.save();
          ctx.filter = FILTER_EFFECTS[currentFilter] || 'none';
          ctx.scale(-1, 1);
          ctx.drawImage(video, -width, 0, width, height);
          ctx.restore();
        }

        // Draw overlay
        if (currentShowOverlay) {
          drawOverlay(ctx, canvas.width, canvas.height, currentCharacter);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  }, []);

  // ─── Cleanup ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
      stopVoiceConversion();
      disconnectFromServer();
    };
  }, [stopCamera, disconnectFromServer]);

  // ─── Voice conversion ────────────────────────────────────────────
  const startVoiceConversion = async () => {
    try {
      setIsVoiceConverting(true);
      setVoiceConversionStatus('Starting microphone...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      sourceNodeRef.current = ctx.createMediaStreamSource(stream);

      const isServerConnected = serverStatus === 'connected' && wsRef.current?.readyState === WebSocket.OPEN;

      if (isServerConnected) {
        // Send audio chunks to server for AI voice cloning
        const bufferSize = 4096;
        const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
        processorNodeRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert float32 array to base64
            const bytes = new Uint8Array(inputData.buffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const b64 = btoa(binary);

            wsRef.current.send(JSON.stringify({
              type: 'audio_chunk',
              character_id: selectedCharacter.id,
              audio: b64,
              sample_rate: ctx.sampleRate,
            }));
          }

          // Silence the direct output (server sends converted audio back)
          const output = e.outputBuffer.getChannelData(0);
          for (let i = 0; i < output.length; i++) {
            output[i] = 0;
          }
        };

        sourceNodeRef.current.connect(processor);
        processor.connect(ctx.destination);

        setVoiceConversionStatus(`🎤 AI Voice Cloning (${selectedCharacter.name})`);

      } else {
        // Browser-only: EQ-based voice effect
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.5;
        gainNodeRef.current = gainNode;

        const filters: BiquadFilterNode[] = [];

        if (selectedCharacter.id === 'uncle-peanut') {
          const lowBoost = ctx.createBiquadFilter();
          lowBoost.type = 'lowshelf';
          lowBoost.frequency.value = 300;
          lowBoost.gain.value = 8;
          filters.push(lowBoost);

          const highCut = ctx.createBiquadFilter();
          highCut.type = 'highshelf';
          highCut.frequency.value = 3000;
          highCut.gain.value = -4;
          filters.push(highCut);

          gainNode.gain.value = 2.0;
        } else if (selectedCharacter.id === 'anime-girl') {
          const highBoost = ctx.createBiquadFilter();
          highBoost.type = 'highshelf';
          highBoost.frequency.value = 2000;
          highBoost.gain.value = 10;
          filters.push(highBoost);

          const lowCut = ctx.createBiquadFilter();
          lowCut.type = 'lowshelf';
          lowCut.frequency.value = 400;
          lowCut.gain.value = -6;
          filters.push(lowCut);

          const presence = ctx.createBiquadFilter();
          presence.type = 'peaking';
          presence.frequency.value = 4000;
          presence.Q.value = 1;
          presence.gain.value = 6;
          filters.push(presence);

          gainNode.gain.value = 1.8;
        } else {
          const clarity = ctx.createBiquadFilter();
          clarity.type = 'peaking';
          clarity.frequency.value = 2500;
          clarity.Q.value = 1;
          clarity.gain.value = 4;
          filters.push(clarity);

          const limiter = ctx.createBiquadFilter();
          limiter.type = 'highshelf';
          limiter.frequency.value = 6000;
          limiter.gain.value = -2;
          filters.push(limiter);
        }

        filterNodesRef.current = filters;

        let lastNode: AudioNode = sourceNodeRef.current;
        for (const filter of filters) {
          lastNode.connect(filter);
          lastNode = filter;
        }
        lastNode.connect(gainNode);
        gainNode.connect(ctx.destination);

        setVoiceConversionStatus(`🔊 ${selectedCharacter.name} voice effect (browser)`);
      }
    } catch (err) {
      console.error('Voice conversion error:', err);
      setVoiceConversionStatus(err instanceof Error ? err.message : 'Failed to start');
      setIsVoiceConverting(false);
    }
  };

  const stopVoiceConversion = useCallback(() => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
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

  // ─── Text transformation ─────────────────────────────────────────
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

  const speakText = () => {
    if (!transformedText || isSpeaking) return;
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(transformedText);

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

  // ─── Render ──────────────────────────────────────────────────────
  const isAiMode = serverStatus === 'connected';

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
            <button
              onClick={() => setShowServerSettings(!showServerSettings)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isAiMode
                  ? 'bg-green-900 text-green-400 hover:bg-green-800'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {isAiMode ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isAiMode ? 'AI Server' : 'Browser Only'}
            </button>
          </div>
        </div>
      </header>

      {/* Server Settings Panel */}
      {showServerSettings && (
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">AI Server (EC2 GPU)</h3>
            </div>

            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={aiServerUrl}
                onChange={(e) => setAiServerUrl(e.target.value)}
                placeholder="ws://your-ec2-ip:8765"
                className="flex-1 bg-slate-900 text-white rounded-lg px-4 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
              />
              {serverStatus === 'connected' ? (
                <button
                  onClick={disconnectFromServer}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => connectToServer(aiServerUrl)}
                  disabled={!aiServerUrl.trim() || serverStatus === 'connecting'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium"
                >
                  {serverStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {/* Connection status */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  serverStatus === 'connected' ? 'bg-green-500' :
                  serverStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  serverStatus === 'error' ? 'bg-red-500' : 'bg-slate-500'
                }`} />
                <span className="text-slate-400 capitalize">{serverStatus}</span>
              </span>

              {isAiMode && (
                <>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    serverCapabilities.faceSwap ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-500'
                  }`}>
                    Face Swap: {serverCapabilities.faceSwap ? 'Ready' : 'No Model'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    serverCapabilities.voiceClone ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-500'
                  }`}>
                    Voice Clone: {serverCapabilities.voiceClone ? 'Ready' : 'No Model'}
                  </span>
                </>
              )}
            </div>

            {!isAiMode && (
              <p className="mt-2 text-slate-500 text-xs">
                Without AI server: CSS filters + EQ voice effects. With AI server: real face swap + voice cloning.
              </p>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Camera Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Container */}
            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
              <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
                <video ref={videoRef} className="hidden" playsInline muted />

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

                {isCameraLoading && (
                  <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Starting camera...</p>
                  </div>
                )}

                {cameraError && (
                  <div className="text-center p-4">
                    <p className="text-red-400 mb-4">{cameraError}</p>
                    <button onClick={startCamera} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
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
                    <span className="text-white text-sm font-medium">
                      {isAiMode ? 'AI Voice' : 'Voice FX'}
                    </span>
                  </div>
                )}

                {/* Mode badge */}
                {isCameraOn && (
                  <div className={`absolute bottom-16 left-4 px-3 py-1.5 rounded-full text-xs font-medium ${
                    isAiMode ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300'
                  }`}>
                    {isAiMode ? 'AI Face Swap' : 'Browser Filters'}
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={isCameraOn ? stopCamera : startCamera}
                      disabled={isCameraLoading}
                      className={`p-3 rounded-full transition-colors ${
                        isCameraOn
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                      title={isCameraOn ? 'Camera On' : 'Camera Off'}
                    >
                      {isCameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={isVoiceConverting ? stopVoiceConversion : startVoiceConversion}
                      className={`p-3 rounded-full transition-colors ${
                        isVoiceConverting
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                      title={isVoiceConverting ? 'Mic On' : 'Mic Off'}
                    >
                      {isVoiceConverting ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Filter selector (browser mode) or Face Swap toggle (AI mode) */}
                  {isAiMode ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={faceSwapEnabled}
                        onChange={(e) => setFaceSwapEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500"
                      />
                      <span className="text-green-400 text-sm font-medium">AI Face Swap</span>
                    </label>
                  ) : (
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
                  )}

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
                  {isAiMode && (
                    <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded">AI</span>
                  )}
                </h3>
                <div className="flex bg-slate-900 rounded-lg p-1">
                  <button
                    onClick={() => setVoiceMode('text')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      voiceMode === 'text' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Text to Speech
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
                      <><RefreshCw className="w-5 h-5 animate-spin" /> Transforming...</>
                    ) : (
                      <><Send className="w-5 h-5" /> Transform to {selectedCharacter.name}</>
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
                            <><StopCircle className="w-4 h-4" /> Stop</>
                          ) : (
                            <><Play className="w-4 h-4" /> Speak</>
                          )}
                        </button>
                      </div>
                      <p className="text-white whitespace-pre-wrap">{transformedText}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 border rounded-lg ${
                    isAiMode ? 'bg-green-900/20 border-green-700' : 'bg-purple-900/20 border-purple-700'
                  }`}>
                    <p className={`text-sm ${isAiMode ? 'text-green-300' : 'text-purple-300'}`}>
                      {isAiMode
                        ? '🤖 AI Voice Cloning active. Your voice will be converted to the selected character in real-time via the AI server.'
                        : '🎤 Browser voice effects. Connect to an AI server for real voice cloning. Use headphones to prevent feedback.'
                      }
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
                      <><StopCircle className="w-5 h-5" /> Stop Voice</>
                    ) : (
                      <><Radio className="w-5 h-5" /> Start {isAiMode ? 'AI Voice Clone' : 'Voice Effect'}</>
                    )}
                  </button>

                  {!isAiMode && (
                    <p className="text-amber-400 text-xs text-center">
                      Use headphones to prevent feedback! Your voice will play through speakers.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Character Selection + Status */}
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
                      <div className="flex-1">
                        <div className="text-white font-medium">{char.name}</div>
                        <div className="text-slate-400 text-sm">{char.description}</div>
                        {isAiMode && (
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              Face {serverCapabilities.faceSwap ? '✓' : '—'}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              Voice {serverCapabilities.voiceClone ? '✓' : '—'}
                            </span>
                          </div>
                        )}
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
                  <span className="text-slate-400">Mode</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isAiMode ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {isAiMode ? 'AI Server (EC2)' : 'Browser Only'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Camera</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isCameraOn ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {isCameraOn ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Voice</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isVoiceConverting ? 'bg-purple-900 text-purple-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {isVoiceConverting ? (isAiMode ? 'AI Clone' : 'EQ Effect') : 'Off'}
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
                  Connect AI server (top-right button) for face swap + voice clone
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">2.</span>
                  Start camera and select a character
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">3.</span>
                  Your face transforms to the character in real-time
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">4.</span>
                  Click mic for live AI voice cloning
                </li>
              </ol>

              {!isAiMode && (
                <div className="mt-3 p-3 bg-amber-900/20 border border-amber-800 rounded-lg">
                  <p className="text-amber-400 text-xs">
                    Without AI server, only CSS filters and EQ voice effects are available.
                    Deploy the ai-server/ to EC2 with GPU for real face swap and voice cloning.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
