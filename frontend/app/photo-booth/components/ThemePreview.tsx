'use client';

// Theme preview data with colors and visual styles
export const themePreviewData: Record<string, {
  gradient: string;
  accent: string;
  icon: string;
  pattern: string;
}> = {
  'mona-lisa': {
    gradient: 'from-amber-900 via-amber-800 to-yellow-900',
    accent: '#8B7355',
    icon: '🎨',
    pattern: 'Renaissance',
  },
  'ghibli-style': {
    gradient: 'from-sky-400 via-green-400 to-emerald-500',
    accent: '#7CB342',
    icon: '✨',
    pattern: 'Anime',
  },
  'versailles-court': {
    gradient: 'from-amber-500 via-yellow-400 to-amber-600',
    accent: '#FFD700',
    icon: '👑',
    pattern: 'Baroque',
  },
  'georgian-england': {
    gradient: 'from-emerald-800 via-green-700 to-teal-800',
    accent: '#2E5A3B',
    icon: '🏛️',
    pattern: 'Georgian',
  },
  'austro-hungarian': {
    gradient: 'from-red-900 via-amber-700 to-red-800',
    accent: '#8B0000',
    icon: '🦅',
    pattern: 'Imperial',
  },
  'russian-imperial': {
    gradient: 'from-blue-900 via-indigo-800 to-slate-800',
    accent: '#1E3A5F',
    icon: '❄️',
    pattern: 'Imperial',
  },
  'italian-venetian': {
    gradient: 'from-red-700 via-amber-600 to-orange-600',
    accent: '#C41E3A',
    icon: '🎭',
    pattern: 'Venetian',
  },
  'spanish-colonial': {
    gradient: 'from-stone-800 via-amber-900 to-stone-900',
    accent: '#4A3728',
    icon: '⚜️',
    pattern: 'Colonial',
  },
};

interface ThemePreviewProps {
  themeId: string;
  themeName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ThemePreview({ themeId, themeName, size = 'md', className = '' }: ThemePreviewProps) {
  const preview = themePreviewData[themeId] || {
    gradient: 'from-purple-600 to-indigo-600',
    accent: '#6B46C1',
    icon: '🖼️',
    pattern: 'Custom',
  };

  const sizeClasses = {
    sm: 'h-24',
    md: 'h-40',
    lg: 'h-56',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${preview.gradient} ${sizeClasses[size]} ${className}`}
    >
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id={`pattern-${themeId}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill="white" />
          </pattern>
          <rect width="100" height="100" fill={`url(#pattern-${themeId})`} />
        </svg>
      </div>

      {/* Frame effect */}
      <div className="absolute inset-2 border-2 border-white/20 rounded pointer-events-none" />
      <div className="absolute inset-3 border border-white/10 rounded pointer-events-none" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
        <span className="text-3xl mb-2 drop-shadow-lg">{preview.icon}</span>
        <span className="text-sm font-semibold text-center drop-shadow-md">{themeName}</span>
        <span className="text-xs opacity-75 mt-1">{preview.pattern}</span>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
    </div>
  );
}

// Generate a data URL for theme preview (for places where component can't be used)
export function getThemePreviewSvg(themeId: string, themeName: string): string {
  const preview = themePreviewData[themeId] || {
    gradient: 'from-purple-600 to-indigo-600',
    accent: '#6B46C1',
    icon: '🖼️',
    pattern: 'Custom',
  };

  // Color mapping for gradients
  const gradientColors: Record<string, [string, string]> = {
    'mona-lisa': ['#78350f', '#92400e'],
    'ghibli-style': ['#38bdf8', '#10b981'],
    'versailles-court': ['#f59e0b', '#d97706'],
    'georgian-england': ['#065f46', '#0f766e'],
    'austro-hungarian': ['#7f1d1d', '#b45309'],
    'russian-imperial': ['#1e3a8a', '#312e81'],
    'italian-venetian': ['#b91c1c', '#ea580c'],
    'spanish-colonial': ['#44403c', '#78350f'],
  };

  const colors = gradientColors[themeId] || ['#6B46C1', '#4C1D95'];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
        </linearGradient>
        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)" />
        </pattern>
      </defs>
      <rect width="300" height="400" fill="url(#grad)" />
      <rect width="300" height="400" fill="url(#dots)" />
      <rect x="10" y="10" width="280" height="380" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" rx="4" />
      <rect x="15" y="15" width="270" height="370" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" rx="2" />
      <text x="150" y="180" font-size="48" text-anchor="middle" fill="white">${preview.icon}</text>
      <text x="150" y="230" font-size="18" font-weight="bold" text-anchor="middle" fill="white" font-family="sans-serif">${themeName}</text>
      <text x="150" y="255" font-size="12" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="sans-serif">${preview.pattern} Style</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}
