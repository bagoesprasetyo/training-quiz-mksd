import { useState, useEffect } from 'react';

/**
 * Hook to detect the user's reduced-motion preference.
 * When true, animations should be minimized or disabled entirely.
 * Spec 81: Accessibility — respect prefers-reduced-motion.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}
