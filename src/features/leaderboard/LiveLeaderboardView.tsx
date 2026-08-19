import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { AnimatedNumber } from '../../components/game/AnimatedNumber';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { SessionParticipant } from '../../types';

interface LiveLeaderboardViewProps {
  participants: SessionParticipant[];
  totalQuestions?: number;
}

/**
 * Live leaderboard with Framer Motion layout animations.
 * Spec 72: Animated ranking cards that move to new positions when rankings change.
 */
export const LiveLeaderboardView: React.FC<LiveLeaderboardViewProps> = ({
  participants,
  totalQuestions = 10,
}) => {
  const reducedMotion = useReducedMotion();

  const sorted = [...(participants || [])].sort((a, b) => {
    const scoreA = a?.total_score || 0;
    const scoreB = b?.total_score || 0;
    const correctA = a?.correct_count || 0;
    const correctB = b?.correct_count || 0;
    const timeA = a?.total_response_time_ms || 0;
    const timeB = b?.total_response_time_ms || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    if (correctB !== correctA) return correctB - correctA;
    return timeA - timeB;
  });

  const rankEmojis = ['🥇', '🥈', '🥉'];
  const rankStyles = [
    'bg-gradient-to-r from-amber-50 to-amber-100/80 border-amber-400 shadow-amber-200/50',
    'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-400 shadow-slate-200/50',
    'bg-gradient-to-r from-amber-800/10 to-amber-50 border-amber-600/40 shadow-amber-200/30',
  ];
  const rankBadgeStyles = [
    'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30',
    'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-400/30',
    'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-700/30',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-extrabold text-slate-900">
            Live Score Leaderboard
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-semibold">Sorted by Score & Response Time</span>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence>
          {sorted.map((p, idx) => {
            const rank = idx + 1;
            const accuracy = totalQuestions > 0 ? Math.round(((p?.correct_count || 0) / totalQuestions) * 100) : 0;
            const isTop3 = rank <= 3;

            return (
              <motion.div
                key={p.id}
                layout={!reducedMotion}
                layoutId={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  layout: { type: 'spring', stiffness: 350, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className={`
                  p-4 rounded-2xl border-2 flex items-center justify-between gap-4 transition-colors
                  ${isTop3 ? rankStyles[idx] : 'bg-white border-slate-200 hover:border-slate-300'}
                  ${isTop3 ? 'shadow-md' : 'shadow-xs'}
                `}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Rank badge */}
                  <div className={`
                    w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0
                    ${isTop3 ? rankBadgeStyles[idx] : 'bg-slate-100 text-slate-600 border border-slate-200'}
                  `}>
                    {isTop3 ? rankEmojis[idx] : rank}
                  </div>

                  {/* Participant info */}
                  <div className="truncate">
                    <p className="font-extrabold text-slate-900 text-sm truncate flex items-center gap-2">
                      {p.nickname}
                      {p.department && (
                        <span className="text-[10px] font-semibold text-slate-400">({p.department})</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span>{p?.correct_count || 0} Correct</span>
                      <span>•</span>
                      <span>{accuracy}% Accuracy</span>
                    </div>
                  </div>
                </div>

                {/* Score with animated number */}
                <div className="text-right shrink-0">
                  <p className="font-black text-lg text-blue-600 tracking-tight">
                    <AnimatedNumber
                      value={p?.total_score || 0}
                      duration={0.5}
                      formatFn={(n) => n.toLocaleString()}
                    />
                    <span className="text-xs font-semibold text-slate-400 ml-1">pts</span>
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
