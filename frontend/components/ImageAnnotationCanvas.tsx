'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Pencil, Eraser, Square, Circle, Minus, Trash2, Download, MessageSquare, RotateCcw } from 'lucide-react';

type Tool = 'pencil' | 'eraser' | 'rect' | 'circle' | 'line' | 'text';
type Stroke = {
  tool: Tool;
  color: string;
  size: number;
  points?: { x: number; y: number }[];
  startX?: number; startY?: number; endX?: number; endY?: number;
  text?: string;
};

interface AnnotationCanvasProps {
  imageUrl?: string;
  imageBase64?: string;
  width?: number;
  height?: number;
  onSave?: (annotationData: { strokes: Stroke[]; comment: string; canvasDataUrl: string }) => void;
  onClose?: () => void;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#000000'];

export default function ImageAnnotationCanvas({
  imageUrl,
  imageBase64,
  width = 800,
  height = 600,
  onSave,
  onClose,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#ef4444');
  const [size, setSize] = useState(3);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [comment, setComment] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);

  // Load background image
  useEffect(() => {
    const bg = bgCanvasRef.current;
    if (!bg) return;
    const ctx = bg.getContext('2d');
    if (!ctx) return;

    const src = imageUrl || (imageBase64 ? `data:image/png;base64,${imageBase64}` : null);
    if (!src) { ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, width, height); setImageLoaded(true); return; }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Scale image to fit canvas
      const scale = Math.min(width / img.width, height / img.height, 1);
      const iw = img.width * scale;
      const ih = img.height * scale;
      const ox = (width - iw) / 2;
      const oy = (height - ih) / 2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, ox, oy, iw, ih);
      setImageLoaded(true);
    };
    img.onerror = () => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#475569';
      ctx.font = '14px monospace';
      ctx.fillText('Image could not be loaded', 20, height / 2);
      setImageLoaded(true);
    };
    img.src = src;
  }, [imageUrl, imageBase64, width, height]);

  // Redraw annotation layer
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }
    if (currentStroke) drawStroke(ctx, currentStroke);
  }, [strokes, currentStroke, width, height]);

  useEffect(() => { redraw(); }, [redraw]);

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    ctx.save();
    ctx.strokeStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,0)' : stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    }

    if (stroke.tool === 'pencil' || stroke.tool === 'eraser') {
      if (!stroke.points?.length) { ctx.restore(); return; }
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    } else if (stroke.tool === 'line') {
      if (stroke.startX == null) { ctx.restore(); return; }
      ctx.beginPath();
      ctx.moveTo(stroke.startX!, stroke.startY!);
      ctx.lineTo(stroke.endX!, stroke.endY!);
      ctx.stroke();
    } else if (stroke.tool === 'rect') {
      if (stroke.startX == null) { ctx.restore(); return; }
      const w = stroke.endX! - stroke.startX!;
      const h = stroke.endY! - stroke.startY!;
      ctx.strokeRect(stroke.startX!, stroke.startY!, w, h);
    } else if (stroke.tool === 'circle') {
      if (stroke.startX == null) { ctx.restore(); return; }
      const rx = Math.abs(stroke.endX! - stroke.startX!) / 2;
      const ry = Math.abs(stroke.endY! - stroke.startY!) / 2;
      const cx = stroke.startX! + (stroke.endX! - stroke.startX!) / 2;
      const cy = stroke.startY! + (stroke.endY! - stroke.startY!) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (stroke.tool === 'text' && stroke.text) {
      ctx.fillStyle = stroke.color;
      ctx.font = `${Math.max(stroke.size * 4, 14)}px sans-serif`;
      ctx.fillText(stroke.text, stroke.startX!, stroke.startY!);
    }
    ctx.restore();
  }

  function getPos(e: React.MouseEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return;
    const pos = getPos(e);
    setIsDrawing(true);
    setStartPos(pos);

    if (tool === 'text') {
      setTextPos(pos);
      return;
    }

    const newStroke: Stroke = {
      tool,
      color,
      size,
      ...(tool === 'pencil' || tool === 'eraser'
        ? { points: [pos] }
        : { startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y }),
    };
    setCurrentStroke(newStroke);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentStroke) return;
    const pos = getPos(e);

    if (tool === 'pencil' || tool === 'eraser') {
      setCurrentStroke(s => s ? { ...s, points: [...(s.points || []), pos] } : s);
    } else {
      setCurrentStroke(s => s ? { ...s, endX: pos.x, endY: pos.y } : s);
    }
  };

  const onMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke && tool !== 'text') {
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  const addText = () => {
    if (!textPos || !textInput.trim()) { setTextPos(null); setTextInput(''); return; }
    setStrokes(prev => [...prev, {
      tool: 'text', color, size, text: textInput, startX: textPos.x, startY: textPos.y,
    }]);
    setTextPos(null);
    setTextInput('');
  };

  const undo = () => setStrokes(prev => prev.slice(0, -1));
  const clear = () => setStrokes([]);

  const handleSave = () => {
    // Merge bg + annotation canvases
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d')!;
    if (bgCanvasRef.current) ctx.drawImage(bgCanvasRef.current, 0, 0);
    if (canvasRef.current) ctx.drawImage(canvasRef.current, 0, 0);
    const dataUrl = offscreen.toDataURL('image/png');
    onSave?.({ strokes, comment, canvasDataUrl: dataUrl });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
        {/* Tools */}
        <div className="flex gap-1">
          {([
            { id: 'pencil', icon: Pencil, title: 'Pencil' },
            { id: 'eraser', icon: Eraser, title: 'Eraser' },
            { id: 'line', icon: Minus, title: 'Line' },
            { id: 'rect', icon: Square, title: 'Rectangle' },
            { id: 'circle', icon: Circle, title: 'Circle' },
            { id: 'text', icon: MessageSquare, title: 'Text' },
          ] as const).map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id as Tool)}
                title={t.title}
                className={`p-1.5 rounded-lg transition-colors ${
                  tool === t.id
                    ? 'bg-rose-500/30 text-rose-400 border border-rose-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-slate-700" />

        {/* Colours */}
        <div className="flex gap-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                color === c ? 'border-white scale-125' : 'border-transparent hover:scale-110'
              }`}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-slate-700" />

        {/* Size */}
        <input
          type="range" min={1} max={20} value={size}
          onChange={e => setSize(Number(e.target.value))}
          className="w-20 accent-rose-500"
        />
        <span className="text-[11px] text-slate-400 w-4">{size}</span>

        <div className="w-px h-5 bg-slate-700" />

        {/* Actions */}
        <button onClick={undo} title="Undo" className="p-1.5 text-slate-400 hover:text-white transition-colors">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={clear} title="Clear all" className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas stack */}
      <div
        className="relative rounded-xl overflow-hidden border border-slate-700/50"
        style={{ width, height, maxWidth: '100%' }}
      >
        <canvas ref={bgCanvasRef} width={width} height={height} className="absolute inset-0" />
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute inset-0"
          style={{ cursor: tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : 'crosshair' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />
        {/* Text input overlay */}
        {textPos && (
          <div
            className="absolute flex gap-1"
            style={{ left: textPos.x, top: textPos.y - 40 }}
            onMouseDown={e => e.stopPropagation()}
          >
            <input
              autoFocus
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addText(); if (e.key === 'Escape') { setTextPos(null); setTextInput(''); } }}
              placeholder="Type annotation…"
              className="bg-slate-900 border border-rose-500/50 rounded px-2 py-1 text-sm text-white w-48"
            />
            <button onClick={addText} className="px-2 py-1 bg-rose-600 text-white text-xs rounded">Add</button>
          </div>
        )}
      </div>

      {/* Comment + save */}
      <div className="flex gap-2">
        <input
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Add a comment to send to the AI operator…"
          className="flex-1 bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
        />
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Save Annotation
        </button>
        {onClose && (
          <button onClick={onClose} className="px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm">
            Close
          </button>
        )}
      </div>
    </div>
  );
}
