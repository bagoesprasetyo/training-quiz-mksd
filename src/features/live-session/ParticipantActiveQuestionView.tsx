import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Lock, XCircle, Zap, ArrowRight } from 'lucide-react';
import { CircularTimer } from '../../components/game/CircularTimer';
import { AnimatedNumber } from '../../components/game/AnimatedNumber';
import { AnimatedBackground } from '../../components/game/AnimatedBackground';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { liveQuizEngineService } from '../../services/liveQuizEngineService';
import { quizService } from '../../services/quizService';
import { useLiveSessionStore } from '../../store/liveSessionStore';
import type { Question, QuestionOption } from '../../types';

interface ParticipantActiveQuestionViewProps {
  quizQuestions: Question[];
}

type QuestionPhase = 'answering' | 'submitted' | 'timeup' | 'reveal' | 'score' | 'leaderboard';

/**
 * Participant active question view — the core game experience.
 * Spec 66: Question transitions with slide/fade.
 * Spec 67: Animated progress bar.
 * Spec 68: Circular timer with warning states.
 * Spec 69: Answer interaction with scale/highlight/lock.
 * Spec 70: Answer reveal with correct/incorrect animation.
 * Spec 71: Score count-up animation with speed bonus.
 * Spec 73: Leaderboard moment between questions.
 */
export const ParticipantActiveQuestionView: React.FC<ParticipantActiveQuestionViewProps> = ({ quizQuestions }) => {
  const { session, currentParticipant } = useLiveSessionStore();
  const { play } = useSoundEffects();
  const reducedMotion = useReducedMotion();

  const [activeQuestions, setActiveQuestions] = useState<Question[]>(quizQuestions);
  const [phase, setPhase] = useState<QuestionPhase>('answering');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastScoreEarned, setLastScoreEarned] = useState(0);
  const [lastSpeedBonus, setLastSpeedBonus] = useState(0);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [prevTotalScore, setPrevTotalScore] = useState(0);
  const prevIndexRef = useRef<number>(-1);

  // Sync activeQuestions with incoming props
  useEffect(() => {
    if (quizQuestions && quizQuestions.length > 0) {
      setActiveQuestions(quizQuestions);
    }
  }, [quizQuestions]);

  // Fallback auto-fetch if questions are empty
  useEffect(() => {
    if (activeQuestions.length === 0 && session?.quiz_id) {
      quizService.getQuizById(session.quiz_id).then(({ questions }) => {
        if (questions && questions.length > 0) {
          setActiveQuestions(questions);
        }
      }).catch(() => {});
    }
  }, [activeQuestions.length, session?.quiz_id]);

  const effectiveQuestions = activeQuestions.length > 0 ? activeQuestions : quizQuestions;
  const currentIndex = session?.current_question_index || 0;
  const currentQ = effectiveQuestions[currentIndex] || effectiveQuestions[0];
  const options = currentQ?.options || [];
  const totalQuestions = effectiveQuestions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  // Log current question
  useEffect(() => {
    if (currentQ?.id) {
      console.log({
        event: 'CURRENT_QUESTION',
        currentQuestionId: currentQ.id,
        currentQuestionIndex: currentIndex,
      });
    }
  }, [currentQ?.id, currentIndex]);

  // Reset state when question changes (trainer advances)
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      setPhase('answering');
      setSelectedOptionId(null);
      setIsSubmitting(false);
      setLastScoreEarned(0);
      setLastSpeedBonus(0);
      setWasCorrect(false);
      setPrevTotalScore(currentParticipant?.total_score || 0);
      prevIndexRef.current = currentIndex;
      if (currentIndex > 0) play('questionStart');
    }
  }, [currentIndex, currentParticipant?.total_score, play]);

  const handleSelectOption = useCallback(async (option: QuestionOption) => {
    if (phase !== 'answering' || isSubmitting || !session || !currentParticipant || !currentQ) return;

    try {
      setIsSubmitting(true);
      setSelectedOptionId(option.id);

      const startMs = session.current_question_start_time
        ? new Date(session.current_question_start_time).getTime()
        : Date.now();
      const responseTimeMs = Math.max(100, Date.now() - startMs);

      const isCorrect = option.is_correct;
      let pointsEarned = 0;
      let speedBonus = 0;

      if (isCorrect) {
        const timeLimitMs = (currentQ.time_limit || 30) * 1000;
        const speedFactor = Math.max(0, 1 - responseTimeMs / timeLimitMs);
        speedBonus = Math.round(speedFactor * 50);
        pointsEarned = 100 + speedBonus;
      }

      await liveQuizEngineService.submitAnswer(
        session.id,
        currentParticipant.id,
        currentQ.id,
        option.id,
        responseTimeMs,
        isCorrect,
        pointsEarned
      );

      setWasCorrect(isCorrect);
      setLastScoreEarned(pointsEarned);
      setLastSpeedBonus(speedBonus);
      setPhase('submitted');
      play(isCorrect ? 'correct' : 'wrong');

      // Auto-advance to reveal after delay
      setTimeout(() => setPhase('reveal'), 1500);
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
      setIsSubmitting(false);
    }
  }, [phase, isSubmitting, session, currentParticipant, currentQ, play]);

  const handleTimeUp = useCallback(() => {
    if (phase === 'answering') {
      setPhase('timeup');
      play('timeup');
      // Auto-advance to reveal
      setTimeout(() => setPhase('reveal'), 2000);
    }
  }, [phase, play]);

  const handleTimerTick = useCallback((secondsLeft: number) => {
    if (secondsLeft <= 5 && secondsLeft > 0 && phase === 'answering') {
      play('tick');
    }
  }, [phase, play]);

  if (!session) return null;

  if (quizQuestions.length === 0) {
    return (
      <AnimatedBackground variant="blue">
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl border-2 border-amber-200 p-8 text-center space-y-4 max-w-md w-full shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto font-bold text-2xl">
              ⏳
            </div>
            <h3 className="text-lg font-black text-slate-900">Menunggu Pertanyaan Kuis...</h3>
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              Trainer belum mengunggah pertanyaan untuk kuis ini. Pertanyaan akan muncul otomatis.
            </p>
          </motion.div>
        </div>
      </AnimatedBackground>
    );
  }

  // Answer option color coding
  const optionColors = [
    { bg: 'bg-red-500', hover: 'hover:bg-red-600', border: 'border-red-500', light: 'bg-red-50' },
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', border: 'border-blue-500', light: 'bg-blue-50' },
    { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', border: 'border-amber-500', light: 'bg-amber-50' },
    { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', border: 'border-emerald-500', light: 'bg-emerald-50' },
    { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', border: 'border-purple-500', light: 'bg-purple-50' },
    { bg: 'bg-pink-500', hover: 'hover:bg-pink-600', border: 'border-pink-500', light: 'bg-pink-50' },
  ];

  // Render reveal overlay for correct/incorrect
  const renderRevealOverlay = () => {
    const correctOption = options.find(o => o.is_correct);
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-5"
      >
        {/* Result banner */}
        <motion.div
          initial={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`p-6 rounded-3xl text-center space-y-2 shadow-lg ${
            wasCorrect
              ? 'bg-emerald-500 text-white shadow-emerald-500/30'
              : selectedOptionId
              ? 'bg-red-500 text-white shadow-red-500/30'
              : 'bg-slate-700 text-white shadow-slate-500/30'
          }`}
        >
          <motion.div
            initial={reducedMotion ? {} : { rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
          >
            {wasCorrect ? (
              <CheckCircle2 className="w-12 h-12 mx-auto" />
            ) : (
              <XCircle className="w-12 h-12 mx-auto" />
            )}
          </motion.div>
          <h3 className="text-2xl font-black">
            {wasCorrect ? 'CORRECT! 🎉' : selectedOptionId ? 'NOT QUITE!' : 'TIME\'S UP!'}
          </h3>
        </motion.div>

        {/* Correct answer display */}
        {correctOption && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-1"
          >
            <p className="text-xs font-bold text-emerald-600 uppercase">Correct Answer</p>
            <p className="text-base font-extrabold text-emerald-800">
              {correctOption.option_text}
            </p>
          </motion.div>
        )}

        {/* Explanation if exists */}
        {currentQ.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1"
          >
            <p className="text-xs font-bold text-blue-600 uppercase">Explanation</p>
            <p className="text-sm text-slate-700 leading-relaxed">{currentQ.explanation}</p>
          </motion.div>
        )}

        {/* Score animation */}
        {selectedOptionId && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-5 rounded-2xl bg-white border-2 border-slate-200 text-center space-y-2 shadow-lg"
          >
            <p className="text-xs font-bold text-slate-400 uppercase">Points Earned</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-black text-slate-900">
                +<AnimatedNumber value={lastScoreEarned} duration={0.8} />
              </span>
            </div>
            {lastSpeedBonus > 0 && (
              <motion.div
                initial={reducedMotion ? {} : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: 'spring' }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-extrabold"
              >
                <Zap className="w-3.5 h-3.5" />
                +{lastSpeedBonus} SPEED BONUS
              </motion.div>
            )}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-semibold">Total Score</p>
              <p className="text-2xl font-black text-blue-600">
                <AnimatedNumber
                  value={prevTotalScore + lastScoreEarned}
                  duration={1}
                  formatFn={(n) => n.toLocaleString()}
                />
                <span className="text-sm font-semibold text-slate-400 ml-1">pts</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* Next question hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-center text-slate-400 font-semibold flex items-center justify-center gap-1"
        >
          <ArrowRight className="w-3 h-3" />
          Waiting for trainer to advance...
        </motion.p>
      </motion.div>
    );
  };

  return (
    <AnimatedBackground variant="blue">
      <div className="min-h-screen flex flex-col p-4 max-w-lg mx-auto">
        {/* Top bar — Progress + Timer */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-4"
        >
          <div className="flex-1 space-y-1.5">
            {/* Question counter */}
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-blue-600 uppercase tracking-wider">
                Question {currentIndex + 1} / {totalQuestions}
              </span>
              <span className="text-slate-400 truncate max-w-[100px]">
                {currentParticipant?.nickname}
              </span>
            </div>
            {/* Animated progress bar (Spec 67) */}
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Circular Timer (Spec 68) */}
          {phase === 'answering' && (
            <CircularTimer
              startTimeIso={session.current_question_start_time}
              timeLimitSeconds={currentQ.time_limit || 30}
              isPaused={session.status === 'paused'}
              onExpire={handleTimeUp}
              onTick={handleTimerTick}
              size={72}
            />
          )}
        </motion.div>

        {/* Main content area with AnimatePresence for question transitions (Spec 66) */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {(phase === 'reveal' || phase === 'score') ? (
              <motion.div
                key={`reveal-${currentIndex}`}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                {renderRevealOverlay()}
              </motion.div>
            ) : (
              <motion.div
                key={`question-${currentIndex}`}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                {/* Question card */}
                <motion.div
                  className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-slate-200/80 p-6 shadow-lg"
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-xl font-black text-slate-900 leading-snug">
                    {currentQ.question_text}
                  </h2>
                  {currentQ.media_url && (
                    <div className="mt-4 rounded-xl overflow-hidden max-h-48 border flex justify-center bg-slate-50">
                      <img src={currentQ.media_url} alt="Question Media" className="max-h-44 object-contain" />
                    </div>
                  )}
                </motion.div>

                {/* Answer choices or submitted/timeup states */}
                {phase === 'submitted' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-blue-500 p-8 text-center space-y-3 shadow-lg"
                  >
                    <motion.div
                      initial={reducedMotion ? {} : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30"
                    >
                      <CheckCircle2 className="w-8 h-8" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-slate-900">Answer Submitted!</h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      Your response is locked. Revealing answer...
                    </p>
                  </motion.div>
                ) : phase === 'timeup' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-red-400 p-8 text-center space-y-3 shadow-lg"
                  >
                    <motion.div
                      animate={reducedMotion ? {} : { rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Lock className="w-10 h-10 text-red-500 mx-auto" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-red-600">TIME'S UP!</h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      Answer submission locked for this question.
                    </p>
                  </motion.div>
                ) : (
                  /* Answer options (Spec 69) */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      {options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isSelected = selectedOptionId === opt.id;
                        const color = optionColors[optIdx % optionColors.length];

                        return (
                          <motion.button
                            key={opt.id || optIdx}
                            type="button"
                            onClick={() => handleSelectOption(opt)}
                            disabled={isSubmitting}
                            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + optIdx * 0.06 }}
                            whileTap={reducedMotion ? {} : { scale: 0.97 }}
                            className={`
                              w-full p-4 rounded-2xl border-2 font-black text-left text-base flex items-center gap-4 transition-all duration-150 cursor-pointer shadow-sm
                              ${isSelected
                                ? `${color.bg} text-white ${color.border} shadow-lg`
                                : `bg-white/95 backdrop-blur text-slate-900 border-slate-200/80 ${color.hover} hover:border-slate-300`
                              }
                            `}
                          >
                            <span className={`
                              w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-all
                              ${isSelected
                                ? 'bg-white/90 text-slate-900'
                                : `${color.light} text-slate-700 border border-slate-200/50`
                              }
                            `}>
                              {letter}
                            </span>
                            <span className={`flex-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                              {opt.option_text}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedBackground>
  );
};
