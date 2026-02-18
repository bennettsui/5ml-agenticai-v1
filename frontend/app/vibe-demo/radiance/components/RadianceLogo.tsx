'use client';

export interface RadianceLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'purple' | 'white';
}

export function RadianceLogo({ variant = 'full', size = 'md', className = '', color = 'purple' }: RadianceLogoProps) {
  const sizeMap = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };

  const colorMap = {
    purple: {
      primary: '#6B21A8',
      secondary: '#7C3AED',
      accent: 'white'
    },
    white: {
      primary: 'white',
      secondary: 'rgba(255, 255, 255, 0.9)',
      accent: '#6B21A8'
    }
  };

  const colors = colorMap[color];

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 120 120"
        className={`${sizeMap[size]} w-auto ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle background */}
        <circle cx="60" cy="60" r="58" fill="none" stroke={colors.primary} strokeWidth="2" />

        {/* R Letter */}
        <g fill={colors.primary}>
          <path d="M 35 35 L 35 85 L 50 85 L 50 60 L 60 60 C 70 60 75 55 75 45 C 75 35 70 35 60 35 L 35 35 Z M 50 47 L 60 47 C 65 47 68 50 68 45 C 68 40 65 40 60 40 L 50 40 L 50 47 Z" />
          <path d="M 60 60 L 75 85 L 65 85 L 52 62 L 60 60 Z" />
        </g>

        {/* Star accent */}
        <g fill={colors.accent}>
          <path d="M 60 25 L 66 42 L 84 42 L 71 53 L 77 70 L 60 59 L 43 70 L 49 53 L 36 42 L 54 42 Z" />
        </g>
      </svg>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`${className}`}>
        <div className="text-sm tracking-widest font-bold" style={{ color: colors.primary, letterSpacing: '2px' }}>
          RADIANCE
        </div>
        <div className="text-[10px] tracking-wide" style={{ color: colors.secondary, letterSpacing: '0.5px', lineHeight: '1.2' }}>
          PR & MARTECH
        </div>
      </div>
    );
  }

  // Full logo - horizontal layout
  return (
    <svg
      viewBox="0 0 1920 400"
      className={`${sizeMap[size]} w-auto ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* R Icon */}
      <g>
        {/* R Letter */}
        <g fill={colors.primary}>
          <path d="M 80 80 L 80 320 L 140 320 L 140 220 L 200 220 C 260 220 290 190 290 140 C 290 90 260 80 200 80 L 80 80 Z M 140 140 L 200 140 C 230 140 240 155 240 140 C 240 125 230 140 200 140 L 140 140 Z M 200 220 L 140 320 L 100 300 L 180 220 Z" />
        </g>

        {/* Star accent on R */}
        <g fill={colors.accent}>
          <path d="M 160 120 L 175 160 L 220 160 L 185 200 L 200 240 L 160 200 L 120 240 L 135 200 L 100 160 L 145 160 Z" />
        </g>
      </g>

      {/* Main text "RADIANCE" */}
      <text
        x="380"
        y="260"
        fontSize="200"
        fontWeight="700"
        fill={colors.primary}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="8"
      >
        RADIANCE
      </text>

      {/* Subtext "PR & MARTECH LIMITED" */}
      <text
        x="380"
        y="330"
        fontSize="56"
        fontWeight="400"
        fill={colors.secondary}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="2"
      >
        PR & MARTECH LIMITED
      </text>
    </svg>
  );
}

