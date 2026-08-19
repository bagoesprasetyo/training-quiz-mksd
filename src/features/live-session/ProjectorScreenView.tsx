import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, Radio, Clock, BarChart3 } from 'lucide-react';
import { QRCodeDisplay } from '../../components/ui/QRCodeDisplay';
import { AnimatedBackground } from '../../components/game/AnimatedBackground';
import { AnimatedNumber } from '../../components/game/AnimatedNumber';
import { CircularTimer } from '../../components/game/CircularTimer';
import { CountdownOverlay } from '../../components/game/CountdownOverlay';
import { FinalRankingRevealView } from '../leaderboard/FinalRankingRevealView';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLiveSessionStore } from '../../store/liveSessionStore';
import { quizService } from '../../services/quizService';
import { liveQuizEngineService } from '../../services/liveQuizEngineService';
import type { Question, ParticipantAnswer } from '../../types';

/**
 * Dedicated Projector / TV / Large Monitor screen.
 * Spec 76: Fullscreen, large typography, high contrast, minimal UI.
 * Shows animations for participant join, quiz start, question changes,
 * timer, answer reveal, leaderboard changes, final ranking.
 */
export const ProjectorScreenView: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, participants, initTrainerSession } = useLiveSessionStore();
  const { play } = useSoundEffects();
  const reducedMotion = useReducedMotion();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<ParticipantAnswer[]>([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownDone, setCountdownDone] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (sessionId) {
      initTrainerSession(sessionId).then((unsub) => { cleanup = unsub; });
    }
    return () => { if (cleanup) cleanup(); };
  }, [sessionId, initTrainerSession]);

  // Fetch questions
  useEffect(() => {
    let timer: any;
    let isCancelled = false;
    const fetch = async () => {
      if (session?.quiz_id && !isCancelled) {
        try {
          const { questions: qList } = await quizService.getQuizById(session.quiz_id);
          if (!isCancelled) {
            setQuestions(qList);
            if (qList.length === 0) timer = setTimeout(fetch, 2500);
          }
        } catch {
          if (!isCancelled) timer = setTimeout(fetch, 3000);
        }
      }
    };
    fetch();
    return () => { isCancelled = true; if (timer) clearTimeout(timer); };
  }, [session?.quiz_id]);

  // Subscribe to answers for current question
  useEffect(() => {
    if (!session || questions.length === 0) return;
    const currentIndex = session.current_question_index || 0;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const unsub = liveQuizEngineService.subscribeToAnswers(session.id, currentQ.id, (data) => {
      setAnswers(data);
    });
    return () => { if (unsub) unsub(); };
  }, [session?.id, session?.current_question_index, questions]);

  // Detect status change to show countdown
  useEffect(() => {
    if (session?.status === 'in_progress' && prevStatus === 'waiting' && !countdownDone) {
      setShowCountdown(true);
    }
    if (session?.status) setPrevStatus(session.status);
  }, [session?.status, prevStatus, countdownDone]);

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg font-bold text-slate-400">Loading Projector View...</p>
        </div>
      </div>
    );
  }

  // Countdown overlay
  if (showCountdown) {
    return (
      <CountdownOverlay
        onComplete={() => { setShowCountdown(false); setCountdownDone(true); }}
        onTick={(step) => { if (step < 3) play('countdown'); if (step === 3) play('questionStart'); }}
      />
    );
  }

  // Finished — cinematic ceremony
  if (session.status === 'finished') {
    return (
      <AnimatedBackground variant="dark">
        <div className="min-h-screen p-8 md:p-12">
          <FinalRankingRevealView participants={participants} totalQuestions={questions.length} />
        </div>
      </AnimatedBackground>
    );
  }

  const joinUrl = `${window.location.origin}/join/${session.pin_code}`;
  const currentIndex = session.current_question_index || 0;
  const currentQ = questions[currentIndex];
  const isInProgress = session.status === 'in_progress' || session.status === 'paused';
  const answeredCount = answers.length;

  // WAITING — Show PIN + QR + participant list
  if (session.status === 'waiting') {
    return (
      <AnimatedBackground variant="dark">
        <div className="min-h-screen text-white p-8 md:p-12 flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                  {session.quiz?.title || 'Training Quiz'}
                </h1>
                <p className="text-sm font-semibold text-slate-400">Live Quiz Session • Projector Mode</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-lg font-extrabold text-emerald-400 uppercase tracking-wider">LOBBY</span>
            </div>
          </div>

          {/* Center — PIN + QR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto py-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-2">
                <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">
                  Join at <span className="text-white font-black underline">{window.location.host}</span>
                </p>
                <p className="text-sm text-blue-400 font-bold uppercase tracking-wider">GAME PIN</p>
              </div>
              <div
                className="bg-white text-blue-600 px-12 py-8 rounded-3xl font-black text-7xl md:text-9xl tracking-[0.25em] shadow-2xl inline-block"
                style={{ textShadow: '0 0 40px rgba(59,130,246,0.15)' }}
              >
                {session.pin_code}
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-lg font-semibold pt-4">
                <Users className="w-6 h-6 text-blue-500" />
                <span>Open your phone browser and enter the PIN above to join!</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center text-center space-y-4">
              <QRCodeDisplay value={joinUrl} size={260} className="p-6 rounded-3xl shadow-2xl" />
              <p className="text-xl font-extrabold text-white">Scan QR Code</p>
            </div>
          </div>

          {/* Footer — participants */}
          <div className="border-t border-slate-800 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Users className="w-7 h-7 text-blue-500" />
                <span>Participants Joined (</span>
                <AnimatedNumber value={participants.length} className="text-blue-400" duration={0.3} />
                <span>)</span>
              </h3>
              <span className="text-sm font-semibold text-slate-500">Realtime Updates</span>
            </div>
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {participants.slice(0, 30).map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-2"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 font-bold text-xs flex items-center justify-center">
                        {p.nickname.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-white">{p.nickname}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {participants.length > 30 && (
                  <div className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-bold text-sm flex items-center">
                    +{participants.length - 30} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  // IN PROGRESS — Show question + timer + answer distribution
  if (isInProgress && currentQ) {
    const options = currentQ.options || [];

    return (
      <AnimatedBackground variant="dark">
        <div className="min-h-screen text-white p-8 md:p-12 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 rounded-xl bg-blue-600 font-black text-base uppercase tracking-wider">
                Question {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-sm font-semibold text-slate-400">{session.quiz?.title}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                <Users className="w-5 h-5 text-blue-400" />
                <AnimatedNumber value={answeredCount} className="text-white text-lg" duration={0.3} />
                <span>/ {participants.length} answered</span>
              </div>
              {session.status === 'paused' && (
                <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-sm uppercase">Paused</span>
              )}
            </div>
          </div>

          {/* Main content — question + timer */}
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="w-full max-w-5xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Question + Timer row */}
                  <div className="flex items-start gap-8">
                    <div className="flex-1">
                      <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                        {currentQ.question_text}
                      </h2>
                      {currentQ.media_url && (
                        <div className="mt-6 rounded-2xl overflow-hidden max-h-64 border border-slate-700 bg-slate-900 flex justify-center">
                          <img src={currentQ.media_url} alt="Media" className="max-h-60 object-contain" />
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      <CircularTimer
                        startTimeIso={session.current_question_start_time}
                        timeLimitSeconds={currentQ.time_limit || 30}
                        isPaused={session.status === 'paused'}
                        size={120}
                      />
                    </div>
                  </div>

                  {/* Answer distribution bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const optCount = answers.filter((a) => a.selected_option_id === opt.id).length;
                      const percent = answeredCount > 0 ? Math.round((optCount / answeredCount) * 100) : 0;
                      const optionColors = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500'];
                      const color = optionColors[optIdx % optionColors.length];

                      return (
                        <div key={opt.id || optIdx} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`w-10 h-10 rounded-xl ${color} text-white font-black text-sm flex items-center justify-center`}>
                                {letter}
                              </span>
                              <span className="font-extrabold text-lg text-white">{opt.option_text}</span>
                            </div>
                            <span className="font-black text-lg text-white">{optCount}</span>
                          </div>
                          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${color}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Progress bar at bottom */}
          <div className="pt-4 border-t border-slate-800">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  // Fallback
  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-bold text-xl">
      Waiting for session...
    </div>
  );
};
