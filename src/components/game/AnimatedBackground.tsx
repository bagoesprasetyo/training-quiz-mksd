import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedBackgroundProps {
  /** Color theme preset */
  variant?: 'blue' | 'dark' | 'celebration';
  children: React.ReactNode;
  className?: string;
}

/**
 * Subtle animated background for participant screens.
 * Spec 77: Gradient movement + floating soft blobs, lightweight on mobile.
 * Spec 82: Uses CSS transform & opacity only for GPU performance.
 */
export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = 'blue',
  children,
  className = '',
}) => {
  const reducedMotion = useReducedMotion();

  const colors = useMemo(() => {
    switch (variant) {
      case 'dark':
        return {
          bg: 'bg-slate-950',
          blobs: [
            'bg-blue-900/20',
            'bg-indigo-900/15',
            'bg-purple-900/10',
          ],
        };
      case 'celebration':
        return {
          bg: 'bg-slate-950',
          blobs: [
            'bg-amber-500/15',
            'bg-blue-600/15',
            'bg-emerald-500/10',
          ],
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30',
          blobs: [
            'bg-blue-400/10',
            'bg-indigo-400/8',
            'bg-violet-400/6',
          ],
        };
    }
  }, [variant]);

  if (reducedMotion) {
    return (
      <div className={`relative min-h-screen ${colors.bg} ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen overflow-hidden ${colors.bg} ${className}`}>
      {/* Floating blobs — GPU-accelerated with transform only */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {colors.blobs.map((color, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-3xl ${color}`}
            style={{
              width: `${280 + i * 80}px`,
              height: `${280 + i * 80}px`,
              top: `${15 + i * 25}%`,
              left: `${10 + i * 30}%`,
            }}
            animate={{
              x: [0, 30 + i * 15, -20 + i * 10, 0],
              y: [0, -20 + i * 10, 25 + i * 8, 0],
              scale: [1, 1.05, 0.97, 1],
            }}
            transition={{
              duration: 18 + i * 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
