'use client';

import { useEffect, useRef } from 'react';

// Matches Python format_chart_output (snake_case)
interface PalaceData {
  palace_id:      number;
  palace_name:    string;
  branch:         string;
  major_stars:    string[];
  transformations: Record<string, string>;
}

interface ZiweiChartCanvasProps {
  houses: PalaceData[];
  lifeHouseIndex: number;
  personName: string;
  birthDate: string;
  hourBranch: string;
  gender: string;
  fiveElementBureau: string;
  starCount: number;
}

export function ZiweiChartCanvas({
  houses,
  lifeHouseIndex,
  personName,
  birthDate,
  hourBranch,
  gender,
  fiveElementBureau,
  starCount,
}: ZiweiChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !houses) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 600;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = 250;
    const middleRadius = 200;
    const innerRadius = 80;

    // Fill background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    // Draw outer circle (12 palaces)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw middle circle (separation line)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, middleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw inner circle (center info)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw 12 palace sections (arranged like reference: top-right to bottom-left clockwise, 4 per side)
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 + 45) * (Math.PI / 180);  // Start from top-right (45°), 30° per palace
      const nextAngle = ((i + 1) * 30 + 45) * (Math.PI / 180);

      // Draw dividing lines
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * outerRadius,
        centerY + Math.sin(angle) * outerRadius
      );
      ctx.stroke();

      // Palace label position (outer ring)
      const labelRadius = outerRadius - 25;
      const labelX = centerX + Math.cos(angle + Math.PI / 12) * labelRadius;
      const labelY = centerY + Math.sin(angle + Math.PI / 12) * labelRadius;

      const palace = houses[i];
      if (!palace) continue;
      const isLifePalace = palace.palace_id === lifeHouseIndex;
      const majorStars    = palace.major_stars ?? [];
      const huaTypes      = Object.values(palace.transformations ?? {});

      // Palace name
      ctx.fillStyle = isLifePalace ? '#fbbf24' : '#cbd5e1';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(palace.palace_name, labelX, labelY);

      // Branch
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Arial, sans-serif';
      ctx.fillText(palace.branch, labelX, labelY + 14);

      // Stars in palace (middle ring)
      const starsY = centerY + Math.sin(angle + Math.PI / 12) * (middleRadius - 20);
      const starsX = centerX + Math.cos(angle + Math.PI / 12) * (middleRadius - 20);

      if (majorStars.length > 0) {
        ctx.fillStyle = '#93c5fd';
        ctx.font = '10px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        majorStars.slice(0, 3).forEach((star, idx) => {
          const offset = (idx - 1) * 12;
          ctx.fillText(star, starsX, starsY + offset);
        });

        if (majorStars.length > 3) {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '8px Arial, sans-serif';
          ctx.fillText(`+${majorStars.length - 3}`, starsX, starsY + 24);
        }
      }

      // Transformations (small indicators)
      if (huaTypes.length > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '8px Arial, sans-serif';
        ctx.textAlign = 'center';
        const transY = centerY + Math.sin(angle + Math.PI / 12) * (middleRadius + 15);
        const transX = centerX + Math.cos(angle + Math.PI / 12) * (middleRadius + 15);
        ctx.fillText(`四化: ${huaTypes.join(',')}`, transX, transY);
      }
    }

    // Draw center info box
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Center text
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(personName, centerX, centerY - 20);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText(birthDate, centerX, centerY + 2);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px Arial, sans-serif';
    ctx.fillText(`${hourBranch}時 ${gender}`, centerX, centerY + 14);

    ctx.fillStyle = '#60a5fa';
    ctx.font = '9px Arial, sans-serif';
    ctx.fillText(`五行: ${fiveElementBureau}`, centerX, centerY + 26);

  }, [houses, lifeHouseIndex, personName, birthDate, hourBranch, gender, fiveElementBureau]);

  return (
    <div className="flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-slate-700/50 bg-slate-900/50"
      />
      <div className="mt-4 text-xs text-slate-400">
        ✨ 紫微斗數 Traditional Ziwei Chart - {starCount} stars detected
      </div>
    </div>
  );
}
