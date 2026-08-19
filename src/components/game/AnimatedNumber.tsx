import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  /** Format the number (e.g., toLocaleString) */
  formatFn?: (n: number) => string;
}

/**
 * Smooth count-up/down number animation.
 * Spec 64: Participant counter number animation.
 * Spec 71: Score count-up animation.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 0.6,
  className = '',
  formatFn,
}) => {
  const reducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => {
    const n = Math.round(v);
    return formatFn ? formatFn(n) : n.toString();
  });
  const prevValueRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) {
      motionValue.set(value);
      prevValueRef.current = value;
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
    });

    prevValueRef.current = value;
    return () => controls.stop();
  }, [value, duration, reducedMotion, motionValue]);

  return <motion.span className={className}>{rounded}</motion.span>;
};
