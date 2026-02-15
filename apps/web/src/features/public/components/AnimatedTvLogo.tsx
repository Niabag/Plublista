import { useState } from 'react';

type TvLogoSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<TvLogoSize, string> = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-48 md:size-64',
  xl: 'size-24',
};

export function AnimatedTvLogo({
  size = 'md',
  animate = true,
  interactive = false,
  tooltipText,
}: {
  size?: TvLogoSize;
  animate?: boolean;
  interactive?: boolean;
  tooltipText?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${SIZE_MAP[size]}`}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => interactive && setHovered(false)}
    >
      <img
        src="/logo-qr.png"
        alt="Publista TV Logo"
        className={`h-full w-full object-contain transition-all duration-300 ${
          animate ? 'animate-tv-glow' : ''
        } ${hovered ? 'scale-110 brightness-125' : ''}`}
      />

      {/* Tooltip */}
      {interactive && tooltipText && hovered && (
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-pub-card px-2 py-1 text-xs text-pub-text-secondary shadow-lg">
          {tooltipText}
        </span>
      )}
    </div>
  );
}

export function TvLoader() {
  return (
    <div className="flex items-center justify-center">
      <div className="size-12 animate-tv-flicker">
        <img src="/logo-qr.png" alt="Chargement..." className="h-full w-full object-contain" />
      </div>
    </div>
  );
}
