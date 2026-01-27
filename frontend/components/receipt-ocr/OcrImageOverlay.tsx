'use client';

import { useEffect, useRef, useState } from 'react';

interface OcrBox {
  id: string;
  text: string;
  x: number;  // 0-1, relative width
  y: number;  // 0-1, relative height
  width: number;  // 0-1
  height: number;  // 0-1
  confidence?: number;
}

interface OcrImageOverlayProps {
  imageUrl: string;
  boxes: OcrBox[];
  showLabels?: boolean;
  highlightText?: string | null;
  onBoxClick?: (box: OcrBox) => void;
  className?: string;
}

export default function OcrImageOverlay({
  imageUrl,
  boxes,
  showLabels = true,
  highlightText = null,
  onBoxClick,
  className = '',
}: OcrImageOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);

  // Draw bounding boxes on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || imageDimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each bounding box
    boxes.forEach((box) => {
      const isHovered = hoveredBox === box.id;
      const isHighlighted = highlightText && box.text.toLowerCase().includes(highlightText.toLowerCase());

      // Convert relative coordinates to pixels
      const x = box.x * imageDimensions.width;
      const y = box.y * imageDimensions.height;
      const width = box.width * imageDimensions.width;
      const height = box.height * imageDimensions.height;

      // Draw rectangle
      ctx.strokeStyle = isHighlighted ? '#f59e0b' : isHovered ? '#3b82f6' : '#ef4444';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.strokeRect(x, y, width, height);

      // Draw semi-transparent fill on hover
      if (isHovered || isHighlighted) {
        ctx.fillStyle = isHighlighted ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)';
        ctx.fillRect(x, y, width, height);
      }

      // Draw label if enabled
      if (showLabels && (isHovered || isHighlighted)) {
        const label = box.text;
        const confidence = box.confidence ? ` (${Math.round(box.confidence * 100)}%)` : '';
        const fullLabel = label + confidence;

        // Background for text
        ctx.fillStyle = isHighlighted ? 'rgba(245, 158, 11, 0.9)' : 'rgba(59, 130, 246, 0.9)';
        const textWidth = ctx.measureText(fullLabel).width;
        const padding = 4;
        const labelY = y > 20 ? y - 20 : y + height + 20;
        ctx.fillRect(x, labelY, textWidth + padding * 2, 18);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(fullLabel, x + padding, labelY + 13);
      }
    });
  }, [boxes, imageDimensions, hoveredBox, highlightText, showLabels]);

  // Handle image load
  const handleImageLoad = () => {
    const image = imageRef.current;
    if (!image) return;

    const { naturalWidth, naturalHeight } = image;
    setImageDimensions({ width: naturalWidth, height: naturalHeight });

    // Update canvas size
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = naturalWidth;
      canvas.height = naturalHeight;
    }
  };

  // Handle mouse move for hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image || imageDimensions.width === 0) return;

    const rect = image.getBoundingClientRect();
    const scaleX = imageDimensions.width / rect.width;
    const scaleY = imageDimensions.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Find hovered box
    const hovered = boxes.find((box) => {
      const x = box.x * imageDimensions.width;
      const y = box.y * imageDimensions.height;
      const width = box.width * imageDimensions.width;
      const height = box.height * imageDimensions.height;

      return mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height;
    });

    setHoveredBox(hovered ? hovered.id : null);
  };

  // Handle click
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onBoxClick || !hoveredBox) return;

    const box = boxes.find((b) => b.id === hoveredBox);
    if (box) {
      onBoxClick(box);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredBox(null)}
      onClick={handleClick}
      style={{ cursor: hoveredBox ? 'pointer' : 'default' }}
    >
      {/* Receipt Image */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Receipt"
        onLoad={handleImageLoad}
        className="max-w-full h-auto block"
        style={{ maxHeight: '80vh' }}
      />

      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
        }}
      />

      {/* Box count badge */}
      {boxes.length > 0 && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
          {boxes.length} words detected
        </div>
      )}
    </div>
  );
}
