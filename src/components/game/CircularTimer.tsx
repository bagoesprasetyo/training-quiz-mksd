import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface CircularTimerProps {
  startTimeIso?: string;
  timeLimitSeconds: number;
  onExpire?: () => void;
  onTick?: (secondsLeft: number) => void;
  isPaused?: boolean;
  size?: number;
}

/**
 * Circular progress ring timer for the participant game view.
 * Spec 68: Visual timer with circular ring, pulse/scale warning at ≤5s, TIME'S UP animation.
 */
export const CircularTimer: React.FC<CircularTimerProps> = ({
  startTimeIso,
  timeLimitSeconds,
  onExpire,
  onTick,
  isPaused = false,
  size = 100,
}) => {
  const reducedMotion = useReducedMotion();
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [expired, setExpired] = useState(false);
  const [localMountMs, setLocalMountMs] = useState(() => Date.now());

  // Reset timer on question or start time change
  useEffect(() => {
    setExpired(false);
    setTimeLeft(timeLimitSeconds);
    setLocalMountMs(Date.now());
  }, [startTimeIso, timeLimitSeconds]);

  const calculateRemaining = useCallback(() => {
    if (startTimeIso) {
      const startMs = new Date(startTimeIso).getTime();
      if (!isNaN(startMs)) {
        const elapsed = Math.floor((Date.now() - startMs) / 1000);
        // Only use server timestamp if it's within a reasonable window (0 to timeLimitSeconds)
        if (elapsed >= 0 && elapsed <= timeLimitSeconds) {
          return Math.max(0, timeLimitSeconds - elapsed);
        }
      }
    }
    // Fallback to local mount duration
    const localElapsed = Math.floor((Date.now() - localMountMs) / 1000);
    return Math.max(0, timeLimitSeconds - localElapsed);
  }, [startTimeIso, timeLimitSeconds, localMountMs]);

  useEffect(() => {
    if (isPaused) return;

    const tick = () => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);
      onTick?.(remaining);

      if (remaining === 0 && !expired) {
        setExpired(true);
        onExpire?.();
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isPaused, calculateRemaining, onExpire, onTick, expired]);

  const percentage = timeLimitSeconds > 0 ? timeLeft / timeLimitSeconds : 0;
  const isLow = timeLeft <= 5 && timeLeft > 0;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentage);

  const ringColor = expired
    ? '#ef4444'
    : isLow
    ? '#ef4444'
    : '#3b82f6';

  const bgRingColor = expired ? '#fecaca' : isLow ? '#fee2e2' : '#e0e7ff';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG Ring */}
      <svg
        width={size}
        height={size}
        className="absolute top-0 left-0 -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgRingColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <AnimatePresence mode="wait">
        {expired ? (
          <motion.div
            key="expired"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <span className="text-xs font-black text-red-500 uppercase leading-tight text-center">
              TIME'S
              <br />
              UP!
            </span>
          </motion.div>
        ) : (
          <motion.span
            key={timeLeft}
            initial={reducedMotion ? false : { scale: 1.3, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className={`font-black text-center leading-none ${
              isLow ? 'text-red-600' : 'text-blue-600'
            }`}
            style={{ fontSize: size * 0.3 }}
          >
            {timeLeft}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Pulse ring when low time */}
      {isLow && !expired && !reducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-red-400"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </div>
  );
};
