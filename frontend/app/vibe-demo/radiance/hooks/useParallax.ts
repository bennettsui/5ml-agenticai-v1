'use client';

import { useEffect, useRef } from 'react';

export function useParallax<T extends HTMLElement = HTMLDivElement>(speed = 0.3) {
  const ref = useRef<T>(null);

  useEffect(() => {
    let rafId: number;
    const el = ref.current;
    if (!el) return;

    // Use the grandparent (the section) for rect calculation since parent is absolute inset-0
    const section = el.closest('section') as HTMLElement | null;

    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const target = section || el.parentElement;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const offset = -rect.top * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on mount to set initial position
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [speed]);

  return ref;
}
