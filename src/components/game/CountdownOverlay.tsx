import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface CountdownOverlayProps {
  onComplete: () => void;
  /** If provided, plays sound for each tick */
  onTick?: (count: number) => void;
}

const STEPS = ['3', '2', '1', 'GO!'] as const;
const STEP_DURATION = 850; // ms per step

/**
 * Full-screen 3…2…1…GO! countdown overlay.
 * Spec 65: Large typography, scale + fade + glow, fires callback on completion.
 */
export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  onComplete,
  onTick,
}) => {
  const reducedMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (stepIndex >= STEPS.length) {
      // Small delay after GO! before dismissing
      const timeout = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 400);
      return () => clearTimeout(timeout);
    }

    onTick?.(stepIndex);

    const timeout = setTimeout(() => {
      setStepIndex((prev) => prev + 1);
    }, STEP_DURATION);

    return () => clearTimeout(timeout);
  }, [stepIndex, onComplete, onTick]);

  if (!visible) return null;

  const currentStep = STEPS[stepIndex];
  const isGo = currentStep === 'GO!';

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {stepIndex < STEPS.length && (
          <motion.div
            key={stepIndex}
            initial={reducedMotion ? { opacity: 0 } : { scale: 2.5, opacity: 0 }}
            animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-col items-center"
          >
            <span
              className={`font-black tracking-tight select-none ${
                isGo
                  ? 'text-8xl sm:text-[10rem] text-emerald-400'
                  : 'text-9xl sm:text-[12rem] text-white'
              }`}
              style={{
                textShadow: isGo
                  ? '0 0 60px rgba(52, 211, 153, 0.5), 0 0 120px rgba(52, 211, 153, 0.2)'
                  : '0 0 60px rgba(59, 130, 246, 0.4), 0 0 120px rgba(59, 130, 246, 0.15)',
              }}
            >
              {currentStep}
            </span>

            {/* Expanding ring effect */}
            {!reducedMotion && (
              <motion.div
                className={`absolute w-48 h-48 rounded-full border-4 ${
                  isGo ? 'border-emerald-400/40' : 'border-blue-400/30'
                }`}
                initial={{ scale: 0.3, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.8 }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle label */}
      {stepIndex < 3 && (
        <motion.p
          className="absolute bottom-20 text-sm font-bold text-slate-500 uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Get Ready...
        </motion.p>
      )}
    </motion.div>
  );
};
