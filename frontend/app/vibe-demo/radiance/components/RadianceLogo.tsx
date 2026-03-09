'use client';

const LOGO_URL = 'http://5ml.mmdbfiles.com/assets/68814efce09033706e5ce918.png';

export interface RadianceLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'purple' | 'white';
}

export function RadianceLogo({ size = 'md', className = '' }: RadianceLogoProps) {
  const sizeMap = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_URL}
      alt="Radiance PR & Martech"
      className={`${sizeMap[size]} w-auto object-contain ${className}`}
    />
  );
}
