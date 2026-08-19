import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { SessionParticipant } from '../../types';

interface LeaderboardMomentProps {
  participants: SessionParticipant[];
  onDismiss: () => void;
  /** How many seconds to show */
  displayDuration?: number;
  /** How many top players to show */
  topN?: number;
}

/**
 * Short leaderboard interstitial shown between questions.
 * Spec 73: "TOP 5" moment, 2-4 seconds, then auto-dismiss.
 */
export const LeaderboardMoment: React.FC<LeaderboardMomentProps> = ({
  participants,
  onDismiss,
  displayDuration = 3,
  topN = 5,
}) => {
  const reducedMotion = useReducedMotion();
  const [show, setShow] = useState(true);

  const sorted = [...(participants || [])]
    .sort((a, b) => {
      const scoreA = a?.total_score || 0;
      const scoreB = b?.total_score || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (a?.total_response_time_ms || 0) - (b?.total_response_time_ms || 0);
    })
    .slice(0, topN);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onDismiss, 400);
    }, displayDuration * 1000);
    return () => clearTimeout(timer);
  }, [displayDuration, onDismiss]);

  const rankEmojis = ['🥇', '🥈', '🥉'];
  const rankColors = [
    'border-amber-400 bg-amber-50/80',
    'border-slate-400 bg-slate-50/80',
    'border-amber-700/50 bg-amber-50/50',
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0, y: 20 }}
            animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm space-y-4"
          >
            {/* Title */}
            <div className="text-center space-y-1">
              <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
              <h2 className="text-2xl font-black text-white tracking-tight">
                TOP {topN}
              </h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current Standings
              </p>
            </div>

            {/* Ranking cards */}
            <div className="space-y-2">
              {sorted.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.08, duration: 0.3 }}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 ${
                    idx < 3 ? rankColors[idx] : 'border-slate-700 bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 bg-white/90 shadow-sm">
                      {idx < 3 ? rankEmojis[idx] : idx + 1}
                    </span>
                    <span className={`font-extrabold text-sm truncate max-w-[160px] ${idx < 3 ? 'text-slate-900' : 'text-white'}`}>
                      {p.nickname}
                    </span>
                  </div>
                  <span className={`font-black text-sm ${idx < 3 ? 'text-blue-600' : 'text-blue-400'}`}>
                    <AnimatedNumber
                      value={p.total_score || 0}
                      duration={0.4}
                      formatFn={(n) => n.toLocaleString()}
                    />
                    <span className="text-xs font-semibold opacity-60 ml-1">pts</span>
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
