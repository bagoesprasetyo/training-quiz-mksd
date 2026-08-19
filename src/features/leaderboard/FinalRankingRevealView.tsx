import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Star, Clock, Target, CheckCircle2 } from 'lucide-react';
import { AnimatedNumber } from '../../components/game/AnimatedNumber';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { SessionParticipant } from '../../types';

interface FinalRankingRevealViewProps {
  participants: SessionParticipant[];
  totalQuestions?: number;
}

/**
 * Cinematic final quiz ceremony with staged winner reveal.
 * Spec 74: Sequential reveal — QUIZ COMPLETE → CALCULATING → 3rd → 2nd → 1st → Leaderboard.
 * Spec 75: Full ranking with Name, Score, Accuracy, Correct, Response Time, Rank.
 */

type RevealPhase =
  | 'complete'
  | 'calculating'
  | 'revealing'
  | 'third'
  | 'second'
  | 'first'
  | 'leaderboard';

const PHASE_TIMINGS: Record<RevealPhase, number> = {
  complete: 1800,
  calculating: 2200,
  revealing: 1500,
  third: 2200,
  second: 2200,
  first: 3000,
  leaderboard: 0, // Final state
};

const PHASES: RevealPhase[] = ['complete', 'calculating', 'revealing', 'third', 'second', 'first', 'leaderboard'];

export const FinalRankingRevealView: React.FC<FinalRankingRevealViewProps> = ({
  participants,
  totalQuestions = 10,
}) => {
  const [currentPhase, setCurrentPhase] = useState<RevealPhase>('complete');
  const { play } = useSoundEffects();
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

  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  // Auto-advance through reveal phases
  useEffect(() => {
    const phaseIdx = PHASES.indexOf(currentPhase);
    if (phaseIdx < 0 || currentPhase === 'leaderboard') return;

    const nextPhase = PHASES[phaseIdx + 1];
    const delay = PHASE_TIMINGS[currentPhase];

    const timer = setTimeout(() => {
      setCurrentPhase(nextPhase);

      // Sound effects at key moments
      if (nextPhase === 'third') play('leaderboard');
      if (nextPhase === 'second') play('leaderboard');
      if (nextPhase === 'first') {
        play('winner');
        // Confetti burst
        if (!reducedMotion) {
          const end = Date.now() + 2500;
          const frame = () => {
            confetti({
              particleCount: 3,
              angle: 60 + Math.random() * 60,
              spread: 55,
              origin: { x: Math.random(), y: Math.random() * 0.4 },
              colors: ['#FFD700', '#3B82F6', '#10B981', '#F59E0B'],
            });
            if (Date.now() < end) requestAnimationFrame(frame);
          };
          frame();
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentPhase, play, reducedMotion]);

  const formatTime = (ms: number) => {
    const secs = (ms / 1000).toFixed(1);
    return `${secs}s`;
  };

  // Phase content renderer
  const renderPhase = () => {
    switch (currentPhase) {
      case 'complete':
        return (
          <motion.div
            key="complete"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={reducedMotion ? {} : { rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Star className="w-16 h-16 text-amber-400 mx-auto" />
            </motion.div>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight"
              style={{ textShadow: '0 0 40px rgba(59,130,246,0.3)' }}>
              QUIZ COMPLETE!
            </h1>
            <p className="text-lg font-semibold text-slate-400">
              All questions have been answered
            </p>
          </motion.div>
        );

      case 'calculating':
        return (
          <motion.div
            key="calculating"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6"
          >
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-4 h-4 rounded-full bg-blue-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              CALCULATING RESULTS...
            </h2>
            <p className="text-sm font-semibold text-blue-400">
              Crunching {sorted.length} participant scores
            </p>
          </motion.div>
        );

      case 'revealing':
        return (
          <motion.div
            key="revealing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-4"
          >
            <Trophy className="w-14 h-14 text-amber-400 mx-auto" />
            <h2 className="text-3xl sm:text-5xl font-black text-white"
              style={{ textShadow: '0 0 40px rgba(251,191,36,0.3)' }}>
              REVEALING WINNERS...
            </h2>
          </motion.div>
        );

      case 'third':
        return third ? renderWinnerCard(third, 3, '🥉', 'from-amber-800/80 to-amber-900', 'border-amber-600') : null;

      case 'second':
        return second ? renderWinnerCard(second, 2, '🥈', 'from-slate-400 to-slate-600', 'border-slate-300') : null;

      case 'first':
        return first ? renderWinnerCard(first, 1, '🥇', 'from-amber-400 to-amber-600', 'border-amber-300') : null;

      case 'leaderboard':
        return renderFinalLeaderboard();

      default:
        return null;
    }
  };

  const renderWinnerCard = (p: SessionParticipant, rank: number, emoji: string, gradient: string, border: string) => {
    const accuracy = totalQuestions > 0 ? Math.round(((p?.correct_count || 0) / totalQuestions) * 100) : 0;
    const isFirst = rank === 1;

    return (
      <motion.div
        key={`winner-${rank}`}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: isFirst ? 1.05 : 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center space-y-5"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-bold text-slate-400 uppercase tracking-widest"
        >
          {rank === 1 ? 'FIRST PLACE' : rank === 2 ? 'SECOND PLACE' : 'THIRD PLACE'}
        </motion.p>

        <motion.div
          className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br ${gradient} border-4 ${border} flex items-center justify-center mx-auto shadow-2xl`}
          initial={reducedMotion ? {} : { rotate: -15 }}
          animate={{ rotate: 0 }}
          transition={{ type: 'spring' }}
          style={isFirst ? { boxShadow: '0 0 60px rgba(251,191,36,0.4)' } : {}}
        >
          <span className="text-5xl sm:text-6xl">{emoji}</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`font-black text-white tracking-tight ${isFirst ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}`}
          style={isFirst ? { textShadow: '0 0 40px rgba(251,191,36,0.4)' } : {}}
        >
          {p.nickname}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20"
        >
          <span className="text-3xl font-black text-white">
            <AnimatedNumber
              value={p.total_score || 0}
              duration={1.2}
              formatFn={(n) => n.toLocaleString()}
            />
          </span>
          <span className="text-sm font-semibold text-slate-300">points</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400"
        >
          <span>{p.correct_count || 0}/{totalQuestions} Correct</span>
          <span>•</span>
          <span>{accuracy}% Accuracy</span>
          <span>•</span>
          <span>{formatTime(p.total_response_time_ms || 0)} Avg</span>
        </motion.div>
      </motion.div>
    );
  };

  const renderFinalLeaderboard = () => (
    <motion.div
      key="leaderboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
          <Trophy className="w-4 h-4" /> Final Training Rankings
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          FINAL LEADERBOARD
        </h1>
      </div>

      {/* Podium — Top 3 */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end justify-center min-h-[260px] pt-6 px-2">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          {second && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2 mb-3 text-center"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-slate-300 border-3 border-slate-200 flex items-center justify-center mx-auto text-2xl shadow-xl">🥈</div>
              <p className="font-extrabold text-white text-sm sm:text-base truncate max-w-[120px]">{second.nickname}</p>
              <p className="text-xs font-bold text-blue-400">{(second.total_score || 0).toLocaleString()} pts</p>
            </motion.div>
          )}
          <div className="w-full h-32 sm:h-44 bg-gradient-to-t from-slate-500 to-slate-400 rounded-t-2xl flex items-center justify-center border-t-4 border-slate-300 font-black text-3xl sm:text-5xl text-white/60 shadow-inner">
            2nd
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center">
          {first && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="space-y-2 mb-4 text-center"
            >
              <div
                className="w-18 h-18 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 border-4 border-amber-200 flex items-center justify-center mx-auto text-4xl shadow-2xl"
                style={{ boxShadow: '0 0 50px rgba(251,191,36,0.5)' }}
              >🥇</div>
              <p className="font-black text-white text-base sm:text-xl truncate max-w-[160px]">{first.nickname}</p>
              <p className="text-sm font-black text-emerald-400">{(first.total_score || 0).toLocaleString()} pts</p>
            </motion.div>
          )}
          <div className="w-full h-44 sm:h-56 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-2xl flex items-center justify-center border-t-4 border-amber-300 font-black text-4xl sm:text-6xl text-white shadow-2xl">
            1st
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          {third && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2 mb-3 text-center"
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-amber-800/40 border-3 border-amber-700 flex items-center justify-center mx-auto text-2xl shadow-xl">🥉</div>
              <p className="font-extrabold text-white text-sm sm:text-base truncate max-w-[120px]">{third.nickname}</p>
              <p className="text-xs font-bold text-blue-400">{(third.total_score || 0).toLocaleString()} pts</p>
            </motion.div>
          )}
          <div className="w-full h-24 sm:h-32 bg-gradient-to-t from-amber-900/60 to-amber-800/40 rounded-t-2xl flex items-center justify-center border-t-4 border-amber-700/50 font-black text-2xl sm:text-4xl text-amber-200/60 shadow-inner">
            3rd
          </div>
        </div>
      </div>

      {/* Complete leaderboard table (Spec 75) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Correct</th>
                <th className="py-3.5 px-4">Accuracy</th>
                <th className="py-3.5 px-4">Avg Time</th>
                <th className="py-3.5 px-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm font-semibold text-slate-300">
              {sorted.map((p, idx) => {
                const accuracy = totalQuestions > 0 ? Math.round(((p?.correct_count || 0) / totalQuestions) * 100) : 0;
                const avgTime = (p?.correct_count || 0) > 0
                  ? formatTime((p?.total_response_time_ms || 0) / (p?.correct_count || 1))
                  : '-';
                const isTop3 = idx < 3;

                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.04 }}
                    className={isTop3 ? 'bg-white/5' : 'hover:bg-white/5'}
                  >
                    <td className="py-3 px-4 font-black text-white">
                      {isTop3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{p.nickname}</td>
                    <td className="py-3 px-4 text-slate-400">{p.department || '-'}</td>
                    <td className="py-3 px-4 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {p?.correct_count || 0}/{totalQuestions}
                    </td>
                    <td className="py-3 px-4">
                      <Target className="w-3.5 h-3.5 text-blue-400 inline mr-1" />
                      {accuracy}%
                    </td>
                    <td className="py-3 px-4">
                      <Clock className="w-3.5 h-3.5 text-slate-400 inline mr-1" />
                      {avgTime}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-blue-400">
                      {(p?.total_score || 0).toLocaleString()} pts
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      <AnimatePresence mode="wait">
        {renderPhase()}
      </AnimatePresence>
    </div>
  );
};
