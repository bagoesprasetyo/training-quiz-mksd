import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, Target, Trophy, Clock, Zap } from 'lucide-react';
import { AnimatedBackground } from '../../components/game/AnimatedBackground';
import { AnimatedNumber } from '../../components/game/AnimatedNumber';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { supabase } from '../../services/supabase';
import type { SessionParticipant, LiveSession } from '../../types';

interface ParticipantResultViewProps {
  session: LiveSession;
  currentParticipant: SessionParticipant | null;
  allParticipants: SessionParticipant[];
  totalQuestions?: number;
}

/**
 * Gamified participant result view shown after quiz finishes.
 * Shows animated rank reveal, score count-up, and confetti for passers.
 */
export const ParticipantResultView: React.FC<ParticipantResultViewProps> = ({
  session,
  currentParticipant,
  allParticipants,
  totalQuestions = 10,
}) => {
  const reducedMotion = useReducedMotion();
  const { play } = useSoundEffects();
  const [showDetails, setShowDetails] = useState(false);
  const [liveParticipant, setLiveParticipant] = useState<SessionParticipant | null>(
    (allParticipants || []).find((p) => p.id === currentParticipant?.id) || currentParticipant
  );
  const [liveParticipantsList, setLiveParticipantsList] = useState<SessionParticipant[]>(allParticipants || []);

  // Fetch complete aggregated results from Supabase tables
  useEffect(() => {
    if (session?.id && currentParticipant?.id) {
      Promise.all([
        supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', session.id),
        supabase
          .from('participant_answers')
          .select('*')
          .eq('session_id', session.id),
      ]).then(([partRes, ansRes]) => {
        const pList = partRes.data || [];
        const aList = ansRes.data || [];

        const syncedList = pList.map((p) => {
          const pAnswers = aList.filter((a) => a.participant_id === p.id);
          if (pAnswers.length === 0) return p;

          const totalScore = pAnswers.reduce((sum, a) => sum + (a.score_earned || 0), 0);
          const correctCount = pAnswers.filter((a) => a.is_correct).length;
          const wrongCount = pAnswers.filter((a) => !a.is_correct).length;
          const totalTime = pAnswers.reduce((sum, a) => sum + (a.response_time_ms || 0), 0);

          return {
            ...p,
            total_score: Math.max(totalScore, p.total_score || 0),
            correct_count: Math.max(correctCount, p.correct_count || 0),
            wrong_count: wrongCount,
            total_response_time_ms: Math.max(totalTime, p.total_response_time_ms || 0),
          };
        });

        if (syncedList.length > 0) {
          setLiveParticipantsList(syncedList);
          const me = syncedList.find((p) => p.id === currentParticipant.id);
          if (me) {
            setLiveParticipant(me);
            console.log({
              event: 'PARTICIPANT_RESULT_LOADED',
              participantId: currentParticipant.id,
              finalResult: me,
            });
          }
        }
      }).catch((err) => {
        console.warn('Error fetching participant final results:', err);
      });
    }
  }, [session?.id, currentParticipant?.id]);

  const activeParticipant = liveParticipant || currentParticipant;
  if (!activeParticipant) return null;

  const targetList = liveParticipantsList.length > 0 ? liveParticipantsList : allParticipants;

  // Calculate rank
  const sorted = [...(targetList || [])].sort((a, b) => {
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

  const rank = sorted.findIndex((p) => p.id === activeParticipant?.id) + 1 || 1;
  const total = sorted.length || 1;

  const actualTotal = totalQuestions > 0 ? totalQuestions : 1;
  const passingGrade = session?.quiz?.passing_grade || 70;
  const accuracy = Math.round(((activeParticipant?.correct_count || 0) / actualTotal) * 100);
  const isPassed = accuracy >= passingGrade;
  const totalAnsweredCount = (activeParticipant?.correct_count || 0) + (activeParticipant?.wrong_count || 0);
  const avgTime = totalAnsweredCount > 0
    ? ((activeParticipant?.total_response_time_ms || 0) / totalAnsweredCount / 1000).toFixed(1)
    : (activeParticipant?.correct_count || 0) > 0
    ? ((activeParticipant?.total_response_time_ms || 0) / (activeParticipant?.correct_count || 1) / 1000).toFixed(1)
    : '0';

  // Trigger confetti and sounds on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 800);

    if (isPassed && !reducedMotion) {
      const confettiTimer = setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#3B82F6', '#FFD700', '#8B5CF6'],
        });
        play('winner');
      }, 1200);
      return () => {
        clearTimeout(timer);
        clearTimeout(confettiTimer);
      };
    } else {
      play('scoreup');
    }

    return () => clearTimeout(timer);
  }, [isPassed, reducedMotion, play]);

  const isTop3 = rank <= 3;
  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <AnimatedBackground variant={isPassed ? 'blue' : 'blue'}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-200/80 p-8 shadow-xl text-center space-y-6"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Status header */}
            <div className="space-y-3">
              <motion.div
                className={`
                  w-18 h-18 rounded-3xl flex items-center justify-center mx-auto shadow-lg
                  ${isPassed
                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600 shadow-emerald-500/20'
                    : 'bg-amber-50 border-2 border-amber-500 text-amber-600 shadow-amber-500/20'
                  }
                `}
                initial={reducedMotion ? {} : { scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
              >
                {isTop3 ? (
                  <span className="text-3xl">{rankEmojis[rank - 1]}</span>
                ) : isPassed ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <Award className="w-8 h-8" />
                )}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-slate-900"
              >
                {isPassed ? 'TRAINING PASSED! 🎉' : 'QUIZ COMPLETED'}
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  isPassed
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}
              >
                {isPassed ? `PASSED (${accuracy}% ≥ ${passingGrade}%)` : `NEEDS IMPROVEMENT (${accuracy}%)`}
              </motion.div>
            </div>

            {/* Score banner with count-up */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white space-y-2 shadow-lg shadow-blue-500/20"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Your Final Score
              </span>
              <p className="text-4xl font-black tracking-tight">
                <AnimatedNumber
                  value={activeParticipant?.total_score || 0}
                  duration={1.5}
                  formatFn={(n) => n.toLocaleString()}
                />
                <span className="text-base font-normal text-blue-200 ml-1">pts</span>
              </p>
              <p className="text-xs font-semibold text-blue-100 pt-1 flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                Final Position: <span className="font-extrabold text-white text-sm ml-1">
                  {isTop3 ? rankEmojis[rank - 1] : ''} Rank #{rank} of {total}
                </span>
              </p>
            </motion.div>

            {/* Metrics grid with stagger */}
            {showDetails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  {
                    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                    label: 'Correct',
                    value: `${activeParticipant?.correct_count || 0} / ${actualTotal}`,
                  },
                  {
                    icon: <Target className="w-4 h-4 text-blue-500" />,
                    label: 'Accuracy',
                    value: `${accuracy}%`,
                  },
                  {
                    icon: <Clock className="w-4 h-4 text-indigo-500" />,
                    label: 'Avg Response',
                    value: `${avgTime}s`,
                  },
                  {
                    icon: <Zap className="w-4 h-4 text-amber-500" />,
                    label: 'Rank',
                    value: `#${rank} of ${total}`,
                  },
                ].map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-1 text-left"
                  >
                    <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      {metric.icon} {metric.label}
                    </span>
                    <p className="text-lg font-black text-slate-900">{metric.value}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <p className="text-xs text-slate-400 font-medium">
              Thank you for participating in {session.quiz?.title || 'this training session'}!
            </p>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedBackground>
  );
};
