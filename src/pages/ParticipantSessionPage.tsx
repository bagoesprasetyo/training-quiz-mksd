import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticipantLobbyView } from '../features/live-session/ParticipantLobbyView';
import { ParticipantActiveQuestionView } from '../features/live-session/ParticipantActiveQuestionView';
import { ParticipantResultView } from '../features/leaderboard/ParticipantResultView';
import { CountdownOverlay } from '../components/game/CountdownOverlay';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { useLiveSessionStore } from '../store/liveSessionStore';
import { quizService } from '../services/quizService';
import type { Question } from '../types';

/**
 * Participant session page — orchestrates the full quiz experience.
 * Handles state transitions: waiting → countdown → in_progress → finished.
 */
export const ParticipantSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, currentParticipant, participants, initParticipantSession, loading } = useLiveSessionStore();
  const { play } = useSoundEffects();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownDone, setCountdownDone] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (sessionId) {
      initParticipantSession(sessionId).then((unsub) => {
        cleanup = unsub;
      });
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [sessionId, initParticipantSession]);

  useEffect(() => {
    let timer: any;
    let isCancelled = false;

    const fetchQuestions = async () => {
      if (session?.quiz_id && !isCancelled) {
        try {
          const { questions: qList } = await quizService.getQuizById(session.quiz_id);
          if (!isCancelled) {
            if (qList && qList.length > 0) {
              setQuestions(qList);
            } else {
              // If questions are still empty, retry in 1.5 seconds
              timer = setTimeout(fetchQuestions, 1500);
            }
          }
        } catch {
          if (!isCancelled) {
            timer = setTimeout(fetchQuestions, 2000);
          }
        }
      }
    };

    fetchQuestions();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [session?.quiz_id, session?.status]);

  // Detect status change from waiting → in_progress to trigger countdown
  useEffect(() => {
    if (session?.status === 'in_progress' && prevStatus === 'waiting' && !countdownDone) {
      setShowCountdown(true);
    }
    if (session?.status) {
      setPrevStatus(session.status);
    }
  }, [session?.status, prevStatus, countdownDone]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Connecting to Quiz Session...</p>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl border-2 border-red-100 bg-red-50/50 shadow-xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold">⚠️</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Sesi Kuis Tidak Ditemukan</h2>
          <p className="text-xs font-semibold text-slate-500">Sesi kuis telah berakhir, telah dihapus, atau PIN tidak valid.</p>
          <a
            href="/join"
            className="inline-block py-2.5 px-6 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition-colors shadow-md"
          >
            Masukkan PIN Lagi
          </a>
        </motion.div>
      </div>
    );
  }

  // Full-screen countdown overlay when quiz starts
  if (showCountdown) {
    return (
      <CountdownOverlay
        onComplete={() => {
          setShowCountdown(false);
          setCountdownDone(true);
        }}
        onTick={(step) => {
          if (step < 3) play('countdown');
          if (step === 3) play('questionStart');
        }}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {session.status === 'waiting' && (
        <motion.div
          key="lobby"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ParticipantLobbyView />
        </motion.div>
      )}
      {(session.status === 'in_progress' || session.status === 'paused') && (
        <motion.div
          key="active"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ParticipantActiveQuestionView quizQuestions={questions} />
        </motion.div>
      )}
      {session.status === 'finished' && (
        <motion.div
          key="finished"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ParticipantResultView
            session={session}
            currentParticipant={currentParticipant}
            allParticipants={participants}
            totalQuestions={questions.length}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
