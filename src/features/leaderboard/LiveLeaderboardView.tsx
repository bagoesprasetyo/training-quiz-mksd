import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import type { SessionParticipant } from '../../types';

interface LiveLeaderboardViewProps {
  participants: SessionParticipant[];
  totalQuestions?: number;
}

export const LiveLeaderboardView: React.FC<LiveLeaderboardViewProps> = ({ 
  participants,
  totalQuestions = 10 
}) => {
  const sorted = [...participants].sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count;
    return a.total_response_time_ms - b.total_response_time_ms;
  });

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
        {sorted.map((p, idx) => {
          const rank = idx + 1;
          const accuracy = totalQuestions > 0 ? Math.round((p.correct_count / totalQuestions) * 100) : 0;

          return (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Card className={`
                p-4 flex items-center justify-between gap-4 border-2 transition-all
                ${rank === 1 
                  ? 'bg-amber-50/60 border-amber-400 shadow-md' 
                  : rank === 2 
                  ? 'bg-slate-100/80 border-slate-300' 
                  : rank === 3 
                  ? 'bg-amber-900/10 border-amber-600/40' 
                  : 'bg-white border-slate-200'
                }
              `}>
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Rank Badge */}
                  <div className={`
                    w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 shadow-xs
                    ${rank === 1 
                      ? 'bg-amber-500 text-white' 
                      : rank === 2 
                      ? 'bg-slate-400 text-white' 
                      : rank === 3 
                      ? 'bg-amber-700 text-white' 
                      : 'bg-slate-100 text-slate-700'
                    }
                  `}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                  </div>

                  {/* Participant Info */}
                  <div className="truncate">
                    <p className="font-extrabold text-slate-900 text-sm truncate flex items-center gap-2">
                      {p.nickname}
                      {p.department && (
                        <span className="text-[10px] font-semibold text-slate-400">({p.department})</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span>{p.correct_count} Correct</span>
                      <span>•</span>
                      <span>{accuracy}% Accuracy</span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className="font-black text-lg text-[#0000FF] tracking-tight">
                    {p.total_score.toLocaleString()} <span className="text-xs font-semibold text-slate-400">pts</span>
                  </p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
