import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface SynchronizedTimerProps {
  startTimeIso?: string;
  timeLimitSeconds: number;
  onExpire?: () => void;
  isPaused?: boolean;
  className?: string;
}

export const SynchronizedTimer: React.FC<SynchronizedTimerProps> = ({
  startTimeIso,
  timeLimitSeconds,
  onExpire,
  isPaused = false,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(timeLimitSeconds);

  useEffect(() => {
    if (!startTimeIso || isPaused) return;

    const calculateRemaining = () => {
      const startMs = new Date(startTimeIso).getTime();
      const nowMs = Date.now();
      const elapsedSec = Math.floor((nowMs - startMs) / 1000);
      const remaining = Math.max(0, timeLimitSeconds - elapsedSec);

      setTimeLeft(remaining);

      if (remaining === 0 && onExpire) {
        onExpire();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 500);

    return () => clearInterval(interval);
  }, [startTimeIso, timeLimitSeconds, isPaused, onExpire]);

  const percentage = Math.max(0, Math.min(100, (timeLeft / timeLimitSeconds) * 100));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
          <Clock className={`w-4 h-4 ${isLowTime ? 'text-red-500 animate-pulse' : 'text-[#0000FF]'}`} />
          <span>Timer Waktu</span>
        </div>
        <span className={`text-2xl font-black font-mono tracking-tight ${isLowTime ? 'text-red-600 animate-bounce' : 'text-[#0000FF]'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${
            isLowTime ? 'bg-red-500' : 'bg-[#0000FF]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
