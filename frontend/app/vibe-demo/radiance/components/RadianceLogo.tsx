export interface RadianceLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RadianceLogo({ variant = 'full', size = 'md', className = '' }: RadianceLogoProps) {
  const sizeMap = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={`${sizeMap[size]} w-auto ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* R with Star */}
        <g fill="#4B1B7F">
          {/* R Letter */}
          <path d="M20 10h15c8 0 12 4 12 10s-4 10-12 10h-8v20H20V10z" />
          {/* Vertical stroke of R */}
          <rect x="20" y="10" width="4" height="50" fill="#4B1B7F" />
          {/* Curved part of R */}
          <path d="M35 40c8 0 12-4 12-10s-4-10-12-10" stroke="#4B1B7F" strokeWidth="4" fill="none" />
          {/* Leg of R */}
          <path d="M35 40l15 20" stroke="#4B1B7F" strokeWidth="4" />

          {/* Star accent */}
          <path
            d="M30 20l2.5-8 2.5 8h8l-6.5 5 2.5 8-6.5-5-6.5 5 2.5-8-6.5-5h8z"
            fill="white"
          />
        </g>
      </svg>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`${className} font-bold`}>
        <div className="text-xl tracking-wider" style={{ color: '#4B1B7F' }}>
          RADIANCE
        </div>
        <div className="text-xs" style={{ color: '#6B4B9F' }}>
          PR & MARTECH
        </div>
      </div>
    );
  }

  // Full logo
  return (
    <svg
      viewBox="0 0 1600 400"
      className={`${sizeMap[size]} w-auto ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main text "RADIANCE" */}
      <text
        x="200"
        y="280"
        fontSize="240"
        fontWeight="900"
        fill="#4B1B7F"
        fontFamily="Arial, sans-serif"
        letterSpacing="20"
      >
        RADIANCE
      </text>

      {/* Star accent on R */}
      <path
        d="M180 140l20-60 20 60h60l-48 35 20 60-52-35-52 35 20-60-48-35h60z"
        fill="white"
        stroke="#4B1B7F"
        strokeWidth="8"
      />

      {/* Subtext */}
      <text
        x="1000"
        y="320"
        fontSize="60"
        fontWeight="300"
        fill="#6B4B9F"
        fontFamily="Arial, sans-serif"
        letterSpacing="8"
      >
        PR & MARTECH LIMITED
      </text>
    </svg>
  );
}
