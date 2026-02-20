'use client';

import { useEffect, useRef } from 'react';

/**
 * Attaches a scroll-based parallax transform to the referenced element.
 * The element should be absolutely positioned inside an overflow:hidden parent.
 * @param speed - fraction of scroll speed (0.3 = 30% — background moves slower)
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(speed = 0.3) {
  const ref = useRef<T>(null);

  useEffect(() => {
    let rafId: number;
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const rect = parent.getBoundingClientRect();
        const offset = -rect.top * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on mount
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [speed]);

  return ref;
}
